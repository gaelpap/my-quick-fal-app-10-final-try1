'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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
      const idToken = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image${index}`, image);
      });
      formData.append('triggerWord', triggerWord);

      const response = await fetch('/api/train-lora', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start Lora training');
      }

      const result = await response.json();
      alert(result.message);
      router.push('/lora-training'); // Redirect back to the Lora training page
    } catch (error) {
      console.error('Error starting Lora training:', error);
      setError('Failed to start Lora training. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          {isLoading ? 'Starting Training...' : 'Start Training'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}