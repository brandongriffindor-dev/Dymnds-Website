import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Types
export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number;
  stock: {
    XS: number;
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  images: string[];
  category: string;
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
