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
  console.log('Generating image for user with token:', idToken);
  try {
    // Verify the user's token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const result = await fal.run("fal-ai/flux-lora", {
      input: {
        prompt: prompt,
        num_images: 1,
        loras: loras.length > 0 ? loras : undefined,
        enable_safety_checker: !disableSafetyChecker,
      },
    }) as GenerateImageResult;

    if (result.images && result.images.length > 0) {
      const imageUrl = result.images[0].url;
      const fullSizeUrl = imageUrl.replace('/thumbnail/', '/full_size/');

      // Save the image data to Firestore using Admin SDK
      const db = getFirestore();

      try {
        const docRef = await db.collection('users').doc(uid).collection('images').add({
          prompt,
          imageUrl: fullSizeUrl,
          createdAt: new Date().toISOString(),
        });
        console.log('Image saved to user account, document ID:', docRef.id);
      } catch (error) {
        console.error('Error saving image to user account:', error);
        throw error;
      }

      return { 
        imageUrl: imageUrl,
        fullSizeUrl: fullSizeUrl,
      };
    } else {
      throw new Error("No image generated");
    }
  } catch (error) {
    console.error('Error generating or saving image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while generating the image');
    }
  }
}