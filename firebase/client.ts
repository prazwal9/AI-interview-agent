import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4hykgzz6FbAoq2EDHPcrFWInP0tX2UzE",
  authDomain: "preppal-4f3d9.firebaseapp.com",
  projectId: "preppal-4f3d9",
  storageBucket: "preppal-4f3d9.firebasestorage.app",
  messagingSenderId: "814371966433",
  appId: "1:814371966433:web:2f73a571c3e3325a0c96a0",
  measurementId: "G-PJPQ1BYXKQ"
};


const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);