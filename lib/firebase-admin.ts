import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  const adminCredentialsString = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!adminCredentialsString) {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS is not set');
  }
  const adminCredentials = JSON.parse(adminCredentialsString);
  initializeApp({
    credential: cert(adminCredentials),
  });
}

export const auth = getAuth();