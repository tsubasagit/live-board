import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let appInstance: FirebaseApp | null = null
let dbInstance: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    if (!firebaseConfig.projectId) {
      throw new Error(
        'Firebase 設定が未読み込みです。.env.local に VITE_FIREBASE_* を設定してください'
      )
    }
    appInstance = initializeApp(firebaseConfig)
  }
  return appInstance
}

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp())
  }
  return dbInstance
}

export const DEFAULT_EVENT_ID =
  import.meta.env.VITE_DEFAULT_EVENT_ID ?? 'demo-event'

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId)
