import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "webtruyenhay-ae0eb",
  appId: "1:767174877469:web:aa065597afba0ef52f41f4",
  apiKey: "AIzaSyA-ZiYU6TkYhaYzVs79XqDKcvqMlHQp0VY",
  authDomain: "webtruyenhay-ae0eb.firebaseapp.com",
  storageBucket: "webtruyenhay-ae0eb.firebasestorage.app",
  messagingSenderId: "767174877469",
  measurementId: "G-7Y6041HHNT"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
