import { httpsCallable } from 'firebase/functions'
import { doc, setDoc, getDocs, collection } from 'firebase/firestore'
import { functions, db } from './firebaseConfig'

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

/**
 * Save user resume to Firestore
 */
export const saveResumeToCloud = async (userId, resumeId, resumeData) => {
  try {
    const resumeRef = doc(db, 'users', userId, 'resumes', resumeId)
    await setDoc(resumeRef, {
      ...resumeData,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving resume to cloud:', error)
    throw error
  }
}

/**
 * Fetch all saved resumes for a user
 */
export const fetchUserResumes = async (userId) => {
  try {
    const resumesRef = collection(db, 'users', userId, 'resumes')
    const snapshot = await getDocs(resumesRef)
    const resumes = []
    snapshot.forEach(doc => {
      resumes.push({ id: doc.id, ...doc.data() })
    })
    return resumes
  } catch (error) {
    console.error('Error fetching user resumes:', error)
    throw error
  }
}

export default {
  generateResumeContent,
  scoreResume,
  saveResumeToCloud,
  fetchUserResumes
}
