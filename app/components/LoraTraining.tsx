'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoraModel {
  url: string;
  triggerWord: string;
  createdAt: string;
}

function LoraTraining() {
  const [loraTrainingsAvailable, setLoraTrainingsAvailable] = useState<number | null>(null);
  const [savedModels, setSavedModels] = useState<LoraModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setLoraTrainingsAvailable(userData?.loraTrainingsAvailable ?? 0);
          setSavedModels(userData?.loraModels ?? []);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to fetch user data. Please try again.');
        }
      }
    };

    fetchUserData();
  }, []);

  const handlePurchaseTraining = () => {
    router.push('/purchase-lora-training');
  };

  if (isLoading) {
    return <div className="text-black">Loading...</div>;
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Lora Training</h2>
      <p className="mb-4">Available trainings: {loraTrainingsAvailable}</p>
      {loraTrainingsAvailable > 0 ? (
        <div>
          <p className="mb-4">You have Lora trainings available. Click below to start a new training:</p>
          <Link href="/start-lora-training" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Start New Lora Training
          </Link>
        </div>
      ) : (
        <div>
          <p className="mb-4">You have no Lora trainings available.</p>
          <button
            onClick={handlePurchaseTraining}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Purchase a new training
          </button>
        </div>
      )}
      {savedModels.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">Your Saved Lora Models</h3>
          <ul>
            {savedModels.map((model, index) => (
              <li key={index} className="mb-2">
                <strong>{model.triggerWord}</strong> - Created on {new Date(model.createdAt).toLocaleDateString()}
                <br />
                <a href={model.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View Model
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default LoraTraining;