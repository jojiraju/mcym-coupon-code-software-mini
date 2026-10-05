import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzj2yfcEzgo-tV0bDUvE4qbXLbKQEwNG0",
  authDomain: "mcym-mini.firebaseapp.com",
  projectId: "mcym-mini",
  storageBucket: "mcym-mini.firebasestorage.app",
  messagingSenderId: "757322243909",
  appId: "1:757322243909:web:17e0f5486357460c03682c",
  measurementId: "G-4J1T1K3SGS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
