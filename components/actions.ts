'use server'

import * as fal from "@fal-ai/serverless-client";
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

fal.config({
  credentials: process.env.FAL_KEY,
});

// Add this near the top of the file, after the imports
console.log('FIREBASE_ADMIN_CREDENTIALS length:', process.env.FIREBASE_ADMIN_CREDENTIALS?.length);

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    const adminCredentialsString = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (!adminCredentialsString) {
      throw new Error('FIREBASE_ADMIN_CREDENTIALS is not set');
    }
    const adminCredentials = JSON.parse(adminCredentialsString);
    initializeApp({
      credential: cert(adminCredentials),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    } else {
      throw new Error('Failed to initialize Firebase Admin SDK: Unknown error');
    }
  }
}

interface LoRA {
  path: string;
  scale: number;
}

interface GenerateImageResult {
  images: { url: string }[];
}

export async function generateImage(prompt: string, loras: LoRA[], disableSafetyChecker: boolean, idToken: string) {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ prompt, loras, disableSafetyChecker }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation failed:', response.status, errorText);
      throw new Error(`Image generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Image generation response:', data);
    return data;
  } catch (error) {
    console.error('Error in generateImage:', error);
    throw error;
  }
}