import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };

// Types
export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock: {
    XS: number;
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number; // Keep for backward compatibility, will store CAD
  price_cad?: number; // Explicit CAD price
  stock: {
    XS: number;
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  images: string[];
  colors?: ProductColor[];
  category: string;
  productType?: string;
  description?: string;
  features?: string[];
  modelSize?: string;
  modelHeight?: string;
  deliveryInfo?: string;
  returnsInfo?: string;
  matchingSetSlug?: string;
  sizeGuide?: {
    chest?: { XS: string; S: string; M: string; L: string; XL: string; XXL: string };
    waist?: { XS: string; S: string; M: string; L: string; XL: string; XXL: string };
  };
  displayOrder: number;
  featured: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: any[];
  shipping_address: any;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  email: string;
  signed_up_at: string;
}

export interface DashboardStats {
  totalImpact: number;
  waitlistCount: number;
  totalRevenue: number;
  totalOrders: number;
}
