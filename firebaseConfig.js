import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCr6YDxjv9uCnCJLC1BrdmrCeWVv2QDx3I",
  authDomain: "social-spot-bd53f.firebaseapp.com",
  projectId: "social-spot-bd53f",
  storageBucket: "social-spot-bd53f.firebasestorage.app",
  messagingSenderId: "562205243501",
  appId: "1:562205243501:web:2ab015e983660273cd6764"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
