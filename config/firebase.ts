// config/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAYp1OFaJXAQ0Y4EUvHm0ldey5ZQVLV3a8",
  authDomain: "lcs-staffing-admin.firebaseapp.com",
  projectId: "lcs-staffing-admin",
  storageBucket: "lcs-staffing-admin.firebasestorage.app",
  messagingSenderId: "202987826735",
  appId: "1:202987826735:web:8b18504ccb61f7d9dfa0da",
  measurementId: "G-ZB16Z3PT2D",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar Authentication
export const auth = getAuth(app)

// Inicializar Firestore (para futuras funcionalidades)
export const db = getFirestore(app)

export default app
