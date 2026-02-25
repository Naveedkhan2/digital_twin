/**
 * Firebase Client Configuration for Epsilon AI Motor Monitoring Dashboard
 * Uses Firebase Realtime Database (same as Python backend)
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCJWIGi5cXVbRmNre0pYPZmGnehnVWEUvs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "motor-f8005.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "motor-f8005",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "motor-f8005.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "989674439785",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:989674439785:web:1390a9bb3ff2b6e2f8cef8",
};

let app: FirebaseApp;
let db: Database;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export { db, app };
