/**
 * Firebase Admin SDK — server-side only.
 *
 * Bypasses Firestore Security Rules (trusted server context).
 * Used by API routes to read/write Firestore without client auth.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string)
 * set in Vercel Dashboard → Settings → Environment Variables.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth as getAdminAuthInstance, type Auth } from 'firebase-admin/auth';
import { logger } from '@/lib/logger';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function initializeAdminSDK(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
      'Add it in Vercel Dashboard → Settings → Environment Variables.'
    );
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. ' +
      'Paste the entire contents of your service account JSON file.'
    );
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });

  logger.info('Firebase Admin SDK initialized', {
    projectId: serviceAccount.project_id,
  });

  return adminApp;
}

/**
 * Get the Admin Firestore instance (server-side, bypasses security rules).
 * Lazy-initializes on first call.
 */
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  const app = initializeAdminSDK();
  adminDb = getFirestore(app);
  return adminDb;
}

/**
 * Get the Admin Auth instance (server-side, for verifyIdToken, getUser, etc.).
 * Lazy-initializes on first call.
 */
let adminAuth: Auth | null = null;
export function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;
  initializeAdminSDK();
  adminAuth = getAdminAuthInstance();
  return adminAuth;
}

// Re-export FieldValue for serverTimestamp, increment, etc.
export { FieldValue };
