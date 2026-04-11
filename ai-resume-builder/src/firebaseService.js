import { httpsCallable } from 'firebase/functions'
import { functions } from './firebaseConfig'

/**
 * Call Gemini API via Firebase Cloud Function to generate improved resume content
 * @param {string} userInput - The user's original resume content
 * @param {string} section - The resume section being improved (e.g., 'experience', 'summary')
 * @returns {Promise<string>} - Improved content from Gemini
 */
export const generateResumeContent = async (userInput, section = 'resume') => {
  try {
    const generateResumeContentFn = httpsCallable(functions, 'generateResumeContent')
    const result = await generateResumeContentFn({
      userInput,
      section
    })
    return result.data.content
  } catch (error) {
    console.error('Error calling generateResumeContent:', error)
    throw error
  }
}

/**
 * Call Gemini API via Firebase Cloud Function to score and analyze resume
 * @param {string} resumeText - The complete resume text
 * @returns {Promise<string>} - Analysis and score from Gemini
 */
export const scoreResume = async (resumeInput) => {
  try {
    const scoreResumeFn = httpsCallable(functions, 'scoreResume')
    const payload = typeof resumeInput === 'string'
      ? { resumeText: resumeInput }
      : resumeInput
    const result = await scoreResumeFn(payload)
    return result.data.analysis
  } catch (error) {
    console.error('Error calling scoreResume:', error)
    throw error
  }
}

export default {
  generateResumeContent,
  scoreResume
}
