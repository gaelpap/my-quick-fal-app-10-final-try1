'use client';

import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_KEY,
});

export default function StartLoraTraining() {
  const [images, setImages] = useState<File[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Check if user has available trainings
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (!userData?.loraTrainingsAvailable || userData.loraTrainingsAvailable < 1) {
        throw new Error('No Lora trainings available. Please purchase a new training.');
      }

      const imageUrls = await uploadImages(images);
      
      // Your original Lora training logic here
      const result = await fal.subscribe("fal-ai/lora-training", {
        input: {
          instance_prompt: triggerWord,
          images_data_url: imageUrls,
        },
      });

      if ('error' in result) {
        throw new Error(result.error as string);
      }

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from fal.ai');
      }

      const loraUrl = result.images[0].url;
      
      // Save the Lora URL to the user's document and decrement available trainings
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        loraModels: arrayUnion({
          url: loraUrl,
          triggerWord: triggerWord,
          createdAt: new Date().toISOString()
        }),
        loraTrainingsAvailable: userData.loraTrainingsAvailable - 1
      });

      alert('Lora training completed successfully!');
      router.push('/lora-training');
    } catch (error) {
      console.error('Error starting Lora training:', error);
      setError(`Failed to start Lora training: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    // Implement your existing image upload logic here
    // This should return an array of image URLs
    console.log('Uploading images:', files);
    // Replace this with your actual image upload logic
    return files.map(() => 'https://placeholder-image-url.com');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Start Lora Training</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Upload Images (4-20 images recommended)</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleImageUpload} 
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Trigger Word</label>
          <input 
            type="text" 
            value={triggerWord} 
            onChange={(e) => setTriggerWord(e.target.value)} 
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || images.length === 0 || !triggerWord}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Training...' : 'Start Training'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}