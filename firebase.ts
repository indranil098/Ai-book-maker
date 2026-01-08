import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjKv-K1eTmoKBD2aHD47Tedf1wSV5ygxA",
  authDomain: "ai-book-maker-92207612-b1b9b.firebaseapp.com",
  projectId: "ai-book-maker-92207612-b1b9b",
  storageBucket: "ai-book-maker-92207612-b1b9b.firebasestorage.app",
  messagingSenderId: "1010567187770",
  appId: "1:1010567187770:web:53bbe0ad58fb1f29101403"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
