import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ImageGenerator } from './ImageGenerator';

export function Page() {
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white shadow-md rounded px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Image Generator App</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </header>

        {!showImageGenerator ? (
          <div className="text-center bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <p className="text-xl text-gray-800 font-semibold mb-4">Welcome to the Image Generator!</p>
            <button
              onClick={() => setShowImageGenerator(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Generating Images
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Image Generator</h2>
            <div className="mb-4">
              <label className="block text-gray-800 text-sm font-bold mb-2">
                Select language:
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="language"
                    value="english"
                    defaultChecked
                  />
                  <span className="ml-2 text-gray-800">English</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="language"
                    value="french"
                  />
                  <span className="ml-2 text-gray-800">Français</span>
                </label>
              </div>
            </div>
            <ImageGenerator />
          </div>
        )}
      </div>
    </div>
  );
}