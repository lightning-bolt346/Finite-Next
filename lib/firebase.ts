import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let firebaseReady = true;

if (!apiKey || !authDomain || !projectId) {
  console.warn("Firebase configuration environment variables are missing. Sync is disabled.");
  firebaseReady = false;
}

// In case the config was wiped by environment issues, gracefully fail auth
const firebaseConfig = {
  apiKey: apiKey || "dummy",
  authDomain: authDomain || "dummy",
  projectId: projectId || "dummy",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseReady };
