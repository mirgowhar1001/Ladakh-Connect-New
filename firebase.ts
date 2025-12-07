import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdarhgeDVba6Dz5xNGcyvkBFK7Vp8XMSg",
  authDomain: "ladakh-connect1.firebaseapp.com",
  projectId: "ladakh-connect1",
  storageBucket: "ladakh-connect1.firebasestorage.app",
  messagingSenderId: "665150606046",
  appId: "1:665150606046:web:a3f2ce2cdf7b460987904f",
  measurementId: "G-WS5L3SL28C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);