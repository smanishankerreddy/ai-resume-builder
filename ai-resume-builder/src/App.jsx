import { useMemo, useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import './App.css'
import { scoreResume, fetchUserResumes, saveResumeToCloud } from './firebaseService'
import { useAuth } from './context/AuthContext'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const weights = {
  experience: 15,
  projects: 15,
  skills: 15,
  education: 10,
  imp: 10,
  summary: 5,
  contact: 5,
  tools: 5,
  softSkills: 5,
  internship: 3,
  certifications: 3,
  achievements: 3,
  leadership: 2,
  languages: 2,
  extracurricular: 2
};

const resumeKeywords = {
  education: [
    ["education", "academic", "coursework"],
    ["degree", "bachelor", "b.tech", "bsc"],
    ["master", "m.tech", "msc"],
    ["phd"],
    ["university", "college"],
    ["cgpa", "gpa"]
  ],
  projects: [
    ["project", "projects", "application", "system", "web app", "mobile app"],
    ["developed", "built", "implemented", "designed", "created"]
  ],
  skills: [
    ["skills", "technical skills", "tools", "technologies"],
    ["react", "node", "python", "java", "c", "c++", "javascript", "sql", "html", "css", "git"]
  ],
  experience: [
    ["experience", "work experience"],
    ["job", "role"],
    ["company", "organization"],
    ["responsibilities"]
  ],
  internship: [
    ["internship", "intern", "trainee", "training"]
  ],
  imp: [
    ["gmail", "email", "@gmail.com", "@outlook.com"],
    ["linkedin", "linkedin.com"],
    ["github", "github.com"],
    ["leetcode", "leetcode.com", "hackerrank", "hackerrank.com", "codechef", "codechef.com"],
    ["portfolio", "portfolio website", "behance", "dribbble", "kaggle", "medium", "dev.to"]
  ],
  certifications: [
    ["certification", "certified", "course"],
    ["udemy", "coursera", "nptel", "google certification", "aws certification"]
  ],
  achievements: [
    ["achievement", "award", "winner", "rank", "scholarship", "medal", "recognition", "top performer"]
  ],
  leadership: [
    ["leader", "team lead", "managed", "organized", "coordinated", "headed"]
  ],
  extracurricular: [
    ["extracurricular", "club", "event", "volunteer", "community", "member"]
  ],
  softSkills: [
    ["communication", "teamwork", "problem solving", "adaptability", "critical thinking", "time management", "collaboration"]
  ],
  tools: [
    ["excel", "power bi", "tableau", "figma", "docker", "aws", "azure", "firebase"]
  ],
  languages: [
    ["english", "hindi", "telugu"],
    ["fluent", "native", "basic"]
  ],
  summary: [
    ["summary", "objective", "profile", "career objective", "about me"]
  ],
  contact: [
    ["phone", "mobile", "contact"],
    ["email"],
    ["address"]
  ]
};

// Top ATS keywords
const atsKeywords = [
  "project","skills","experience","education","internship","certification","achievement","portfolio","linkedin","github",
  "react","node","javascript","python","java","sql","html","css","mongodb","express","api","rest api",
  "machine learning","data analysis","pandas","numpy","power bi","tableau","excel","statistics",
  "aws","azure","docker","kubernetes","firebase","ci/cd","deployment",
  "communication","teamwork","leadership","problem solving","critical thinking",
  "developed","designed","implemented","built","created","optimized","improved","analyzed",
  "summary","objective","profile","leetcode","hackerrank","codechef","kaggle",
  "full stack","frontend","backend","web development","mobile app","software engineer"
];

function App() {
  const [page, setPage] = useState('home')
  const [resumeData, setResumeData] = useState({
    personal: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      summary: 'Experienced software engineer with 5+ years in full-stack development, specializing in React, Node.js, and cloud technologies.'
    },
    experience: [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        duration: '2022 - Present',
        description: 'Led development of scalable web applications serving 1M+ users. Implemented microservices architecture and improved performance by 40%. Mentored junior developers and established coding standards.'
      },
      {
        id: 2,
        title: 'Software Engineer',
        company: 'StartupXYZ',
        location: 'Remote',
        duration: '2020 - 2022',
        description: 'Developed and maintained React-based dashboard applications. Collaborated with cross-functional teams to deliver features on time. Optimized database queries reducing load times by 30%.'
      }
    ],
    education: [
      {
        id: 1,
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of California, Berkeley',
        year: '2016 - 2020',
        gpa: '3.8/4.0'
      }
    ],
    skills: [
      'JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'
    ],
    projects: [
      {
        id: 1,
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce solution with React frontend, Node.js backend, and MongoDB. Features include user authentication, payment processing, and admin dashboard.',
        technologies: 'React, Node.js, MongoDB, Stripe API',
        link: 'https://github.com/johndoe/ecommerce'
      }
    ]
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)

  const { user, loginWithGoogle, logout } = useAuth()
  const [savedResumes, setSavedResumes] = useState([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [savingResume, setSavingResume] = useState(false)

  useEffect(() => {
    if (user && page === 'my-resumes') {
      loadResumes()
    }
  }, [user, page])

  const loadResumes = async () => {
    setLoadingResumes(true)
    try {
      const resumes = await fetchUserResumes(user.uid)
      setSavedResumes(resumes)
    } catch (err) {
      console.error("Error loading resumes", err)
    } finally {
      setLoadingResumes(false)
    }
  }

  const handleSaveResume = async () => {
    if (!user) {
      alert("Please login to save your resume!")
      return
    }
    setSavingResume(true)
    try {
      const resumeId = resumeData.personal.name.replace(/\s+/g, '_').toLowerCase() || Date.now().toString()
      await saveResumeToCloud(user.uid, resumeId, resumeData)
      alert("Resume saved successfully!")
    } catch (error) {
      console.error("Error saving resume", error)
      alert("Failed to save. Try again.")
    } finally {
      setSavingResume(false)
    }
  }

  const badgeClass =
    'inline-block rounded-full px-3 py-1 text-xs font-semibold text-white bg-pink-500/90'

  const buildSummary = useMemo(() => {
    const { personal, experience, education, skills, projects } = resumeData
    let output = `${personal.name}\n`
    output += `${personal.email} | ${personal.phone} | ${personal.location}\n\n`

    if (personal.summary) {
      output += `PROFESSIONAL SUMMARY\n${personal.summary}\n\n`
    }

    if (experience.length > 0) {
      output += `EXPERIENCE\n`
      experience.forEach(exp => {
        output += `${exp.title}\n${exp.company}, ${exp.location}\n${exp.duration}\n${exp.description}\n\n`
      })
    }

    if (education.length > 0) {
      output += `EDUCATION\n`
      education.forEach(edu => {
        output += `${edu.degree}\n${edu.school}, ${edu.year}`
        if (edu.gpa) output += ` (GPA: ${edu.gpa})`
        output += `\n\n`
      })
    }

    if (skills.length > 0) {
      output += `SKILLS\n${skills.join(' • ')}\n\n`
    }

    if (projects.length > 0) {
      output += `PROJECTS\n`
      projects.forEach(proj => {
        output += `${proj.name}\n${proj.description}\nTechnologies: ${proj.technologies}`
        if (proj.link) output += `\n${proj.link}`
        output += `\n\n`
      })
    }

    return output.trim()
  }, [resumeData])

  const updatePersonal = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }))
  }

  const updateExperience = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      title: '',
      company: '',
      location: '',
      duration: '',
      description: ''
    }
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }))
  }

  const removeExperience = (id) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  const updateEducation = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const addEducation = () => {
    const newEdu = {
      id: Date.now(),
      degree: '',
      school: '',
      year: '',
      gpa: ''
    }
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const removeEducation = (id) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const updateSkills = (skillsString) => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean)
    setResumeData(prev => ({ ...prev, skills }))
  }

  const updateProject = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }))
  }

  const addProject = () => {
    const newProj = {
      id: Date.now(),
      name: '',
      description: '',
      technologies: '',
      link: ''
    }
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }))
  }

  const removeProject = (id) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }))
  }



  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file)
        setAnalysisResult(null)
      } else {
        alert('Please upload a PDF or DOCX document (.pdf, .docx)')
      }
    }
  }

  const extractTextFromPDF = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          fullText += strings.join(" ") + " ";
        }
        resolve(fullText);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9\s@.]/g, " ");
  };

  const runMagicFormula = async () => {
    if (!uploadedFile) {
      setAnalysisError('Please upload a file first');
      return;
    }

    setAnalyzing('magic');
    setAnalysisError(null);

    try {
      let text = "";
      if (uploadedFile.type === 'application/pdf') {
        text = await extractTextFromPDF(uploadedFile);
      } else {
        throw new Error("Our Magic Formula currently only supports PDFs for local parsing. Please upload a PDF or use Deep AI Analysis.");
      }

      const normalizedText = normalizeText(text);
      const rawTextLower = text.toLowerCase();
      let totalScore = 0;
      let maxScore = 0;
      let result = {};

      for (let category in resumeKeywords) {
        const groups = resumeKeywords[category];
        let found = [];
        let missing = [];
        let groupMatches = 0;

        groups.forEach(group => {
          let groupMatched = false;
          let matchedWord = null;

          for (let word of group) {
            const lowerWord = word.toLowerCase();
            let isMatch = false;

            // Dedicated pattern checks for special cases
            if (['email', 'gmail'].includes(lowerWord)) {
              isMatch = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(normalizedText);
            } else if (lowerWord.startsWith('@')) {
              const escapedDomain = lowerWord.replace(/\./g, '\\.');
              const regex = new RegExp(`[a-z0-9._%+-]+${escapedDomain}`);
              isMatch = regex.test(normalizedText);
            } else if (['linkedin', 'linkedin.com'].includes(lowerWord)) {
              isMatch = /linkedin\.com/.test(rawTextLower) || /\blinkedin\b/.test(normalizedText);
            } else if (['github', 'github.com'].includes(lowerWord)) {
              isMatch = /github\.com/.test(rawTextLower) || /\bgithub\b/.test(normalizedText);
            } else if (['leetcode', 'leetcode.com'].includes(lowerWord)) {
              isMatch = /leetcode\.com/.test(rawTextLower) || /\bleetcode\b/.test(normalizedText);
            } else if (['hackerrank', 'hackerrank.com'].includes(lowerWord)) {
              isMatch = /hackerrank\.com/.test(rawTextLower) || /\bhackerrank\b/.test(normalizedText);
            } else if (['codechef', 'codechef.com'].includes(lowerWord)) {
              isMatch = /codechef\.com/.test(rawTextLower) || /\bcodechef\b/.test(normalizedText);
            } else if (['portfolio', 'portfolio website'].includes(lowerWord)) {
              isMatch = /(https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|me|io|dev|net|org)/.test(rawTextLower) || /\bportfolio\b/.test(normalizedText);
            } else {
              // Regex matching with word boundaries
              const escapedWord = lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedWord}\\b`);
              
              // Fallback inclusion check to handle variations in word forms
              isMatch = regex.test(normalizedText) || normalizedText.includes(lowerWord);
            }

            if (isMatch) {
              groupMatched = true;
              matchedWord = word;
              break; // Stop looking in this group once one requirement variation is met
            }
          }

          if (groupMatched) {
            groupMatches++;
            found.push(matchedWord);
          } else {
            // Default to the first word in the group as the representative missing keyword
            missing.push(group[0]);
          }
        });

        let score = (groupMatches / groups.length) * 100;
        result[category] = { found, missing, score: Math.round(score) };

        const weight = weights[category] || 1; // Default to a lightweight of 1 if not explicitly in weights
        totalScore += (score * weight);
        maxScore += (100 * weight);
      }

      const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      setAnalysisResult({
        type: 'magic',
        score: finalScore,
        fileName: uploadedFile.name,
        details: result
      });
    } catch (err) {
      setAnalysisError(`Magic Formula failed: ${err.message}`);
    } finally {
      setAnalyzing(null);
    }
  };

  const runAIAnalysis = async () => {
    if (!uploadedFile) {
      setAnalysisError('Please upload a file first')
      return
    }

    setAnalyzing('ai')
    setAnalysisError(null)

    const dataUrlToBase64 = (dataUrl) => {
      const marker = ';base64,'
      const index = dataUrl.indexOf(marker)
      return index >= 0 ? dataUrl.slice(index + marker.length) : ''
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target.result
          const base64Data = dataUrlToBase64(dataUrl)
          const resumeFile = {
            fileName: uploadedFile.name,
            mimeType: uploadedFile.type,
            base64Data,
          }

          const analysis = await scoreResume({ resumeFile })

          const parseAnalysis = (data) => {
            console.log("Analysis payload from backend:", data);

            if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
               return {
                 score: data.score ?? 75,
                 strengths: Array.isArray(data.strengths) ? data.strengths : (Array.isArray(data.pros) ? data.pros : []),
                 weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : (Array.isArray(data.cons) ? data.cons : []),
                 suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
               };
            }

            return {
              score: 75,
              strengths: ["Could not fetch specific strengths."],
              weaknesses: ["Formatting or parsing issue. Please try another PDF."],
              suggestions: ["Check if your file is a valid PDF/Word file without password protection."]
            };
          }

          const parsed = parseAnalysis(analysis)

          setAnalysisResult({
            type: 'ai',
            score: parsed.score,
            fileName: uploadedFile.name,
            strengths: parsed.strengths,
            weaknesses: parsed.weaknesses,
            suggestions: parsed.suggestions,
          })
        } catch (err) {
          const code = err?.code ? ` (${err.code})` : ''
          const detailsJson = err?.details ? JSON.stringify(err.details) : ''
          const detailsSnippet = detailsJson ? ` Details: ${detailsJson.slice(0, 250)}` : ''
          const customDataJson = err?.customData ? JSON.stringify(err.customData) : ''
          const customDataSnippet = customDataJson ? ` CustomData: ${customDataJson.slice(0, 250)}` : ''
          const rawSummary = JSON.stringify(
            {
              message: err?.message,
              code: err?.code,
              detailsType: err?.details ? typeof err.details : null,
              details: err?.details,
              customData: err?.customData,
            },
            null,
            0
          )
          setAnalysisError(
            `Analysis failed${code}: ${err?.message || String(err)}${detailsSnippet}${customDataSnippet}` +
              (detailsJson ? '' : ` (Raw: ${rawSummary.slice(0, 220)})`)
          )
          console.error('Analysis error:', err)
        } finally {
          setAnalyzing(null)
        }
      }
      reader.readAsDataURL(uploadedFile)
    } catch (err) {
      setAnalysisError(`Error reading file: ${err.message}`)
      setAnalyzing(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#E6F4FF] text-slate-800 flex flex-col">
      <header className="bg-pink-100 border-b border-pink-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-pink-500 px-2 py-1 text-xs sm:text-sm font-bold text-white">AI Resume</span>
            <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm font-medium text-pink-700">
              {['home', 'build', 'analyze', 'my-resumes'].map((key) => {
                const label =
                  key === 'my-resumes' ? 'My Resumes' : key === 'home' ? 'Home' : key === 'build' ? 'Build Resume' : 'Analyze Resume'
                return (
                  <button
                    key={key}
                    onClick={() => setPage(key)}
                    className={`rounded-md px-2 sm:px-3 py-1 transition ${page === key ? 'bg-pink-500 text-white' : 'hover:bg-pink-200'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs sm:text-sm font-medium text-pink-700 hidden sm:inline">Welcome, {user.displayName?.split(' ')[0] || 'User'}</span>
                <button onClick={logout} className="rounded-md border border-pink-200 bg-white px-3 py-1 text-xs sm:text-sm font-semibold text-pink-600 hover:bg-pink-50 whitespace-nowrap">Logout</button>
              </>
            ) : (
              <button onClick={loginWithGoogle} className="rounded-md bg-white px-3 py-1 text-xs sm:text-sm font-semibold text-pink-600 hover:bg-pink-50 whitespace-nowrap">Login</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full py-6">
        {page === 'home' && (
          <section className="rounded-3xl bg-sky-50 p-6 sm:p-10 shadow-sm ring-1 ring-sky-100 max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">
              AI Resume Builder & Analyzer
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              Build an ATS-friendly resume in minutes. Generate, score, and improve with smart AI-first suggestions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setPage('build')}
                className="rounded-xl bg-pink-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-pink-600 transition"
              >
                Build Resume
              </button>
              <button
                onClick={() => setPage('analyze')}
                className="rounded-xl border border-pink-300 bg-white px-6 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition"
              >
                Analyze Resume
              </button>
            </div>
          </section>
        )}

        {page === 'build' && (
          <section className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Resume Editor</h2>

                {/* Personal Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={resumeData.personal.name}
                      onChange={(e) => updatePersonal('name', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={resumeData.personal.email}
                      onChange={(e) => updatePersonal('email', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={resumeData.personal.phone}
                      onChange={(e) => updatePersonal('phone', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={resumeData.personal.location}
                      onChange={(e) => updatePersonal('location', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <textarea
                      placeholder="Professional Summary"
                      value={resumeData.personal.summary}
                      onChange={(e) => updatePersonal('summary', e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                  </div>
                </div>

                {/* Experience */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Experience</h3>
                    <button
                      onClick={addExperience}
                      className="rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 hover:bg-green-200"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp) => (
                      <div key={exp.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-600">Experience Entry</span>
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={exp.location}
                            onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={exp.duration}
                            onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <textarea
                            placeholder="Description"
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Education</h3>
                    <button
                      onClick={addEducation}
                      className="rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.education.map((edu) => (
                      <div key={edu.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-600">Education Entry</span>
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="School"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Year"
                            value={edu.year}
                            onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="GPA (optional)"
                            value={edu.gpa}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Skills</h3>
                  <textarea
                    placeholder="Skills (comma-separated)"
                    value={resumeData.skills.join(', ')}
                    onChange={(e) => updateSkills(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                  />
                </div>

                {/* Projects */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Projects</h3>
                    <button
                      onClick={addProject}
                      className="rounded-md bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 hover:bg-purple-200"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.projects.map((proj) => (
                      <div key={proj.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-600">Project Entry</span>
                          <button
                            onClick={() => removeProject(proj.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Project Name"
                            value={proj.name}
                            onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <textarea
                            placeholder="Description"
                            value={proj.description}
                            onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Technologies"
                            value={proj.technologies}
                            onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Link (optional)"
                            value={proj.link}
                            onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Resume Preview</h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">Live preview updates as you edit</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveResume}
                      disabled={savingResume}
                      className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition flex items-center gap-2 disabled:bg-slate-300"
                    >
                      <span>💾</span> {savingResume ? 'Saving...' : 'Save to Cloud'}
                    </button>
                    <button
                      onClick={() => {
                        // Basic PDF download using browser print
                        const printWindow = window.open('', '_blank')
                        const resumeHTML = buildSummary.replace(/\n/g, '<br>')
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Resume - ${resumeData.personal.name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                              </style>
                            </head>
                            <body>
                              <h1>${resumeData.personal.name}</h1>
                              <p>${resumeData.personal.email} | ${resumeData.personal.phone} | ${resumeData.personal.location}</p>
                              <pre style="white-space: pre-wrap; font-family: inherit;">${resumeHTML}</pre>
                            </body>
                          </html>
                        `)
                        printWindow.document.close()
                        printWindow.print()
                      }}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <span>📄</span> PDF
                    </button>
                    <button
                      onClick={() => {
                        // Basic Word document download
                        const resumeHTML = buildSummary.replace(/\n/g, '<br>')
                        const wordContent = `
                          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                            <head>
                              <meta charset="utf-8">
                              <title>Resume - ${resumeData.personal.name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                pre { white-space: pre-wrap; font-family: inherit; }
                              </style>
                            </head>
                            <body>
                              <h1>${resumeData.personal.name}</h1>
                              <p>${resumeData.personal.email} | ${resumeData.personal.phone} | ${resumeData.personal.location}</p>
                              <pre>${resumeHTML}</pre>
                            </body>
                          </html>
                        `

                        const blob = new Blob([wordContent], { type: 'application/msword' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${resumeData.personal.name.replace(/\s+/g, '_')}_resume.doc`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <span>📝</span> Word
                    </button>
                  </div>
                </div>
                <div className="min-h-[600px] rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-relaxed text-slate-700 overflow-y-auto font-mono">
                  <pre className="whitespace-pre-wrap break-words">{buildSummary}</pre>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={badgeClass}>ATS Friendly</span>
                  <span className={badgeClass}>Action Verbs</span>
                  <span className={badgeClass}>Modern Layout</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'analyze' && (
          <section className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Analyze Resume</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">Upload your resume in PDF or Word format.</p>

                {analysisError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-700">
                      ✗ {analysisError}
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <div className="text-3xl">📎</div>
                    <span className="text-sm font-semibold text-slate-700">Choose file</span>
                    <span className="text-xs text-slate-500">or drag and drop</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadedFile && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm font-semibold text-green-700">
                      ✓ File selected: {uploadedFile.name}
                    </p>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
                    >
                      Clear file
                    </button>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={runMagicFormula}
                    disabled={!uploadedFile || analyzing !== null}
                    className="w-full rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {analyzing === 'magic' ? (
                      <><span className="animate-spin">⏳</span>Analyzing...</>
                    ) : (
                      '✨ Our Magic Formula (Fast & Accurate)'
                    )}
                  </button>
                  <button
                    onClick={runAIAnalysis}
                    disabled={!uploadedFile || analyzing !== null}
                    className="w-full rounded-lg border border-pink-500 bg-white px-4 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {analyzing === 'ai' ? (
                      <><span className="animate-spin">⏳</span>Calling AI...</>
                    ) : (
                      '🤖 Deep AI Analysis'
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Analysis Results</h2>
                {!analysisResult && (
                  <p className="mt-2 text-sm text-slate-500">Upload and analyze a resume to see results.</p>
                )}
                {analysisResult && (
                  <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-700">
                    <div>
                      <span className="font-semibold">File:</span> {analysisResult.fileName}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold">Score:</span>
                      <span className="text-lg sm:text-xl font-bold text-pink-500">{analysisResult.score}</span>
                      <span className="text-slate-500">/100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${analysisResult.score}%` }}
                      />
                    </div>
                    
                    {analysisResult.type === 'ai' && (
                      <>
                        <div>
                          <span className="font-semibold text-green-600">✓ Strengths:</span>
                          <ul className="mt-1 list-disc pl-5">
                            {analysisResult.strengths?.map((pro, idx) => (
                              <li key={`pro-${idx}`}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-600">⚠ Areas to Improve:</span>
                          <ul className="mt-1 list-disc pl-5">
                            {analysisResult.weaknesses?.map((con, idx) => (
                              <li key={`con-${idx}`}>{con}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-600">💡 AI Suggestions:</span>
                          <ul className="mt-1 list-disc pl-5">
                            {analysisResult.suggestions?.map((suggestion, idx) => (
                              <li key={`suggestion-${idx}`}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {analysisResult.type === 'magic' && (
                      <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {Object.keys(analysisResult.details).map(cat => {
                          const catData = analysisResult.details[cat];
                          return (
                            <div key={cat} className="rounded border border-slate-200 p-3 bg-slate-50">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-800 capitalize">{cat}</h3>
                                <span className="text-xs font-semibold bg-white border border-slate-200 px-2 py-1 rounded">
                                  Coverage: {catData.score}%
                                </span>
                              </div>
                              <div className="mt-2 text-xs">
                                <p className="text-green-600 font-medium break-words">
                                  ✅ Found: {catData.found.length > 0 ? catData.found.join(", ") : "None"}
                                </p>
                                <p className="text-red-500 font-medium break-words mt-1">
                                  ❌ Missing: {catData.missing.length > 0 ? catData.missing.join(", ") : "None"}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {page === 'my-resumes' && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">My Resumes</h2>
            {!user ? (
              <div className="rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200 text-center">
                <p className="text-slate-600 mb-4">Please log in to view and save your resumes.</p>
                <button onClick={loginWithGoogle} className="rounded-xl bg-pink-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-pink-600 transition">Login with Google</button>
              </div>
            ) : loadingResumes ? (
              <div className="flex justify-center p-10"><span className="text-slate-500">Loading your resumes...</span></div>
            ) : savedResumes.length === 0 ? (
               <div className="rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200 text-center">
                <p className="text-slate-600">You don't have any saved resumes yet. Go to 'Build Resume' to create one!</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedResumes.map(resume => (
                   <div key={resume.id} 
                        onClick={() => { setResumeData(resume); setPage('build'); }}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition cursor-pointer flex flex-col justify-between">
                     <div>
                       <h3 className="font-bold text-lg text-slate-800">{resume.personal?.name || 'Untitled Resume'}</h3>
                       <p className="text-sm text-slate-500 mt-1">{resume.personal?.summary?.substring(0, 50) || 'No summary'}...</p>
                     </div>
                     <p className="text-xs text-slate-400 mt-4 border-t pt-2">Updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                   </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
