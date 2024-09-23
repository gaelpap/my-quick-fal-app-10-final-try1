'use client';

import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
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

      const imageUrls = await uploadImages(images);
      
      const result = await fal.subscribe("fal-ai/lora-training", {
        input: {
          instance_prompt: triggerWord,
          images_data_url: imageUrls,
        },
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const loraUrl = result.images[0].url;
      
      // Save the Lora URL to the user's document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        loraModels: arrayUnion({
          url: loraUrl,
          triggerWord: triggerWord,
          createdAt: new Date().toISOString()
        })
      });

      alert('Lora training completed successfully!');
      router.push('/lora-training');
    } catch (error) {
      console.error('Error starting Lora training:', error);
      setError('Failed to start Lora training. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    // Implement your image upload logic here
    // This should upload the images and return an array of URLs
    // You may want to use Firebase Storage or another service for this
    // For now, we'll return a placeholder
    return ['https://placeholder-image-url.com'];
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