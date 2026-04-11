// Load environment variables from .env file
// Ensure we load `functions/.env` regardless of the process working directory.
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const functions = require("firebase-functions");
const {onCall, onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

let pdfParse = null
let mammoth = null

try {
  pdfParse = require("pdf-parse")
} catch (err) {
  logger.error("Failed to load pdf-parse dependency", { message: err?.message })
}

try {
  mammoth = require("mammoth")
} catch (err) {
  logger.error("Failed to load mammoth dependency", { message: err?.message })
}

// Set global options for cost control
functions.setGlobalOptions({ maxInstances: 10 });

// Get API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.error("GEMINI_API_KEY is not set in environment variables");
}

const parseGeminiError = (error) => {
  // axios errors include `response` for HTTP failures
  if (error?.response) {
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    status: undefined,
    data: undefined,
    message: error?.message || String(error),
    stack: error?.stack,
  };
};

const getFileExtension = (fileName) => {
  const parts = String(fileName || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const extractTextFromResumeFile = async (filePayload) => {
  if (!filePayload || typeof filePayload !== "object") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "resumeFile payload must be an object with fileName, mimeType, and base64Data"
    );
  }

  const { fileName, mimeType, base64Data } = filePayload;
  if (!base64Data || typeof base64Data !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "resumeFile.base64Data is required"
    );
  }

  const extension = getFileExtension(fileName);
  const type = String(mimeType || "").toLowerCase();
  const buffer = Buffer.from(base64Data, "base64");

  if (type === "application/pdf" || extension === "pdf") {
    if (!pdfParse) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "PDF parsing support is unavailable. Please ensure the pdf-parse dependency is installed."
      );
    }
    const data = await pdfParse(buffer);
    return String(data?.text || "").trim();
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    if (!mammoth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "DOCX parsing support is unavailable. Please ensure the mammoth dependency is installed."
      );
    }
    const { value } = await mammoth.extractRawText({ buffer });
    return String(value || "").trim();
  }

  if (type === "application/msword" || extension === "doc") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Legacy Word .doc files are not supported. Please upload a .docx or PDF file."
    );
  }

  if (type === "text/plain" || extension === "txt") {
    return buffer.toString("utf8").trim();
  }

  throw new functions.https.HttpsError(
    "invalid-argument",
    `Unsupported resume file type: ${mimeType || fileName || "unknown"}. Supported formats are PDF and DOCX.`
  );
};

const GEMINI_API_VERSIONS = (process.env.GEMINI_API_VERSIONS || "v1,v1beta")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Try a small set of commonly available models.
// You can override with GEMINI_MODEL_CANDIDATES (comma-separated).
const GEMINI_MODEL_CANDIDATES = (process.env.GEMINI_MODEL_CANDIDATES ||
  "gemini-1.5-flash,gemini-1.5-pro,gemini-1.5-pro-latest,gemini-1.0-pro")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const GEMINI_TOTAL_MODEL_CANDIDATES = parseInt(
  process.env.GEMINI_TOTAL_MODEL_CANDIDATES || "6",
  10
);
const GEMINI_LIST_TIMEOUT_MS = parseInt(
  process.env.GEMINI_LIST_TIMEOUT_MS || "20000",
  10
);
const GEMINI_GENERATE_TIMEOUT_MS = parseInt(
  process.env.GEMINI_GENERATE_TIMEOUT_MS || "20000",
  10
);

const normalizeModelId = (model) => {
  // Some APIs return "models/<id>" as the full name.
  const m = String(model || "").trim()
  return m.startsWith("models/") ? m.slice("models/".length) : m
}

const listGeminiModels = async (apiVersion) => {
  // Docs: GET /{version}/models
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${GEMINI_API_KEY}&pageSize=100`
  const response = await axios.get(url, { timeout: GEMINI_LIST_TIMEOUT_MS })
  // Response shape is typically { models: [...] }
  return response.data?.models || []
}

let cachedCandidateModelIds = null;

const callGeminiGenerateContent = async ({ prompt, maxOutputTokens }) => {
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens,
    },
  };

  const candidateModelIds = cachedCandidateModelIds
    ? new Set(cachedCandidateModelIds)
    : new Set(
        GEMINI_MODEL_CANDIDATES.map((m) => normalizeModelId(m)).filter(Boolean)
      );

  if (!cachedCandidateModelIds) {
    // Discover compatible models once per cold start.
    // Limits avoid slow/huge retries.
    for (const apiVersion of GEMINI_API_VERSIONS) {
      try {
        const models = await listGeminiModels(apiVersion);
        for (const m of models) {
          if (candidateModelIds.size >= GEMINI_TOTAL_MODEL_CANDIDATES) break;

          const modelId = normalizeModelId(m?.name || m?.model || m?.id || "");
          const methods =
            m?.supportedGenerationMethods ||
            m?.supported_generation_methods ||
            [];
          const methodsLower = (Array.isArray(methods) ? methods : []).map((x) =>
            String(x).toLowerCase()
          );

          if (modelId && methodsLower.includes("generatecontent")) {
            candidateModelIds.add(modelId);
          }
        }

        if (candidateModelIds.size >= GEMINI_TOTAL_MODEL_CANDIDATES) break;
      } catch (e) {
        logger.error("Gemini listModels failed", {
          apiVersion,
          message: e?.message || String(e),
        });
      }
    }

    cachedCandidateModelIds = Array.from(candidateModelIds);
    logger.info("Gemini candidate models cached", {
      count: cachedCandidateModelIds.length,
    });
  }

  let lastErr;
  for (const apiVersion of GEMINI_API_VERSIONS) {
    for (const model of candidateModelIds) {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      logger.info("Calling Gemini API attempt", { apiVersion, model });

      try {
        const response = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: GEMINI_GENERATE_TIMEOUT_MS,
        });

        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new functions.https.HttpsError(
            "internal",
            `Invalid response from Gemini API (${model}, ${apiVersion})`,
            { response: response.data }
          );
        }

        return response.data.candidates[0].content.parts[0].text;
      } catch (error) {
        lastErr = error;
        if (error instanceof functions.https.HttpsError) throw error;
        const geminiError = parseGeminiError(error);
        logger.error("Gemini attempt failed", {
          apiVersion,
          model,
          message: geminiError.message,
          status: geminiError.status,
        });
      }
    }
  }

  const geminiError = parseGeminiError(lastErr);
  throw new functions.https.HttpsError(
    "internal",
    `Gemini request failed: ${geminiError.message}`,
    geminiError
  );
};

// Cloud Function: Generate Resume Content using Gemini API
exports.generateResumeContent = onCall(async (request) => {
  try {
    const { userInput, section } = request.data || {};

    if (!userInput) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "userInput is required"
      );
    }

    if (!GEMINI_API_KEY) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Gemini API key is not configured"
      );
    }

    const prompt = `You are a professional resume writer. Based on the following user input for the ${section || "resume"} section, generate professional, ATS-friendly content. Keep it concise but impactful.

User Input: ${userInput}

Provide only the improved content, no extra explanation.`;

    logger.info("Calling Gemini API for content generation", { section });

    const generatedContent = await callGeminiGenerateContent({
      prompt,
      maxOutputTokens: 512,
    });

    logger.info("Resume content generated successfully", { section });

    return {
      success: true,
      content: generatedContent
    };
  } catch (error) {
    // If we already threw an HttpsError, keep it typed.
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    const geminiError = parseGeminiError(error);
    logger.error("Error generating resume content:", {
      message: geminiError.message,
      status: geminiError.status,
      data: geminiError.data,
    });

    throw new functions.https.HttpsError(
      "internal",
      `Failed to generate content: ${geminiError.message}`,
      geminiError
    );
  }
});

// Cloud Function: Score Resume using Gemini API
exports.scoreResume = onCall(async (request) => {
  try {
    const { resumeText, resumeFile } = request.data || {};
    const hasResumeText = typeof resumeText === "string" && resumeText.trim().length > 0;
    const hasResumeFile = resumeFile && typeof resumeFile === "object";

    logger.info("scoreResume request", {
      hasResumeText,
      hasResumeFile,
      fileName: resumeFile?.fileName,
      mimeType: resumeFile?.mimeType,
      requestDataKeys: Object.keys(request.data || {}),
      originalTextLength: hasResumeText ? resumeText.length : undefined,
    });

    if (!hasResumeText && !hasResumeFile) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "resumeText or resumeFile is required"
      );
    }

    let normalizedText = hasResumeText ? String(resumeText) : "";

    if (!hasResumeText) {
      normalizedText = await extractTextFromResumeFile(resumeFile);
      logger.info("Extracted resume text from file", {
        fileName: resumeFile?.fileName,
        mimeType: resumeFile?.mimeType,
        extractedLength: normalizedText.length,
      });
    }

    if (!normalizedText || !normalizedText.trim()) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Resume text could not be extracted or was empty. Please upload a valid PDF or DOCX resume file."
      );
    }

    if (!GEMINI_API_KEY) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Gemini API key is not configured"
      );
    }

    const trimmedText = normalizedText.length > 12000
      ? normalizedText.slice(0, 12000)
      : normalizedText;

    if (trimmedText.length !== normalizedText.length) {
      logger.warn("Resume text truncated for Gemini prompt", {
        originalLength: normalizedText.length,
        truncatedLength: trimmedText.length,
      });
    }

    const prompt = `You are an expert resume analyst. Analyze the following resume.

Return ONLY valid JSON with this exact shape (no markdown, no extra keys, no trailing text):
{
  "score": number,           // 0-100
  "strengths": string[],    // 3-4 items
  "areasToImprove": string[], // 3-4 items
  "recommendations": string[] // 3-4 items
}

Resume:
${trimmedText}`;

    logger.info("Calling Gemini API with resumeText", { length: trimmedText.length });

    const analysis = await callGeminiGenerateContent({
      prompt,
      maxOutputTokens: 512,
    });

    logger.info("Resume scored successfully");

    return {
      success: true,
      analysis: analysis,
    };
  } catch (error) {
    // If we already threw an HttpsError, keep it typed.
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    const geminiError = parseGeminiError(error);
    logger.error("Error scoring resume:", {
      message: geminiError.message,
      status: geminiError.status,
      data: geminiError.data,
    });

    throw new functions.https.HttpsError(
      "internal",
      `Failed to analyze resume: ${geminiError.message}`,
      geminiError
    );
  }
});

// Health check endpoint
exports.healthCheck = onRequest((request, response) => {
  logger.info("Health check called");
  response.json({
    status: "ok",
    message: "Firebase Functions are running"
  });
});
