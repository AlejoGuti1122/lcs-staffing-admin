// config/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Configuración de Firebase con fallbacks
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAYp1OFaJXAQ0Y4EUvHm0ldey5ZQVLV3a8",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "lcs-staffing-admin.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lcs-staffing-admin",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "lcs-staffing-admin.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "202987826735",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:202987826735:web:8b18504ccb61f7d9dfa0da",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ZB16Z3PT2D",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar Authentication
export const auth = getAuth(app)

// Inicializar Firestore
export const db = getFirestore(app)

export default app
