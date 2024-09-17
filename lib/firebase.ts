import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGCCwD21JK-hSUGwGHlx1yP0qBg5CkpJg",
  authDomain: "my-quick-fal-app-firebase-1.firebaseapp.com",
  projectId: "my-quick-fal-app-firebase-1",
  storageBucket: "my-quick-fal-app-firebase-1.appspot.com",
  messagingSenderId: "391278500178",
  appId: "1:391278500178:web:cd49331d0c8cf11e0e828b",
  measurementId: "G-X5F5Z27WR8"
};
// Parse the Firebase Admin credentials from the environment variable
let firebaseAdminCredentials;
try {
  firebaseAdminCredentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '');
} catch (error) {
  console.error('Error parsing FIREBASE_ADMIN_CREDENTIALS:', error);
  firebaseAdminCredentials = null;
}

// Add the parsed credentials to the firebaseConfig
if (firebaseAdminCredentials) {
  firebaseConfig.credential = firebaseAdminCredentials;
} else {
  console.warn('Firebase Admin credentials not found or invalid');
}

let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseDb: Firestore;
let firebaseAnalytics: Analytics | undefined;

export function initFirebase() {
  try {
    if (getApps().length > 0) {
      console.warn('Firebase app already initialized');
      firebaseApp = getApps()[0];
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
    
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    
    if (typeof window !== 'undefined') {
      firebaseAnalytics = getAnalytics(firebaseApp);
    }
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export function getFirebaseAuth() {
  if (!firebaseAuth) {
    initFirebase();
  }
  return firebaseAuth;
}

export function getFirebaseDb() {
  if (!firebaseDb) {
    initFirebase();
  }
  return firebaseDb;
}

export function getFirebaseAnalytics() {
  if (typeof window !== 'undefined' && !firebaseAnalytics) {
    initFirebase();
  }
  return firebaseAnalytics;
}

// Call initFirebase immediately to ensure Firebase is initialized
initFirebase();

// At the end of the file, after initFirebase();
console.log('Firebase initialized:', getApps().length > 0);