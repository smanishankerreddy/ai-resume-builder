import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBMhEcoUaxp09IL5I1mKzwCq1B4PkBDiQI',
  authDomain: 'ai-resume-builder-8217a.firebaseapp.com',
  projectId: 'ai-resume-builder-8217a',
  storageBucket: 'ai-resume-builder-8217a.appspot.com',
  messagingSenderId: '1058739648733',
  appId: '1:1058739648733:web:8f3c0f2b8a7e5e5e5e5'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Functions
// Use explicit region to avoid callable endpoint mismatches.
export const functions = getFunctions(app, 'us-central1')

// Use Functions emulator during local development (avoids needing redeploy).
const shouldUseFunctionsEmulator =
  // Vite dev server
  import.meta.env.DEV ||
  // Fallback for cases where DEV flag isn't set (or for previews)
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')

if (shouldUseFunctionsEmulator) {
  console.info('[firebaseConfig] Using Functions emulator at localhost:5001')
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

export default app
