import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { env } from './env';

// Re-export types from the standalone types module
export type { Product, ProductColor, Order, OrderItem, ShippingAddress, WaitlistEntry, DashboardStats, Review, StockRecord, SizeGuideRecord } from '@/lib/types';

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (safe for SSR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth - lazy initialize on client only
let authInstance: ReturnType<typeof getAuth> | null = null;
export const getAuthClient = () => {
  if (typeof window !== 'undefined' && !authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
};
export { signInWithEmailAndPassword, signOut, onAuthStateChanged, onIdTokenChanged };
export type { User };
