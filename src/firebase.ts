import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "webtruyenhay-ae0eb",
  appId: "1:767174877469:web:aa065597afba0ef52f41f4",
  apiKey: "AIzaSyA-ZiYU6TkYhaYzVs79XqDKcvqMlHQp0VY",
  authDomain: "webtruyenhay-ae0eb.firebaseapp.com",
  storageBucket: "webtruyenhay-ae0eb.firebasestorage.app",
  messagingSenderId: "767174877469",
  measurementId: "G-7Y6041HHNT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save user profile to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp()
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    console.error("Error logging in:", error);
    alert("Lỗi Firebase Auth: " + (error.message || String(error)) + `\n\n[MÃ ĐANG DÙNG CỦA ANH KẾT NỐI VÀO LÀ LÀ]:\n${firebaseConfig.apiKey}\n\n(Lưu ý: Bạn cần bật Google Sign-in trong Firebase Console và thêm localhost vào Authorized domains!)`);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Removed throw new Error() so UI doesn't crash entirely when Firestore isn't fully configured
}
