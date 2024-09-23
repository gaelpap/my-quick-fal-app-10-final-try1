'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function LoraTraining() {
  const [loraTrainingsAvailable, setLoraTrainingsAvailable] = useState<number | null>(null);
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
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to fetch available trainings. Please try again.');
        }
      }
    };

    fetchUserData();
  }, []);

  const handleTrainLora = async () => {
    if (loraTrainingsAvailable && loraTrainingsAvailable > 0) {
      setIsLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/train-lora', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ /* training data */ }),
        });

        if (!response.ok) {
          throw new Error('Failed to start Lora training');
        }

        setLoraTrainingsAvailable(prev => prev !== null ? prev - 1 : 0);
        // Handle successful training start
        alert('Lora training started successfully!');
      } catch (error) {
        console.error('Error starting Lora training:', error);
        setError('Failed to start Lora training. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push('/purchase-lora-training');
    }
  };

  if (loraTrainingsAvailable === null) {
    return <div className="text-black">Loading...</div>;
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Lora Training</h2>
      <p className="mb-4">Available trainings: {loraTrainingsAvailable}</p>
      <button 
        onClick={handleTrainLora} 
        disabled={isLoading || loraTrainingsAvailable === 0}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {isLoading ? 'Training...' : 'Train Lora Model'}
      </button>
      {loraTrainingsAvailable === 0 && (
        <div className="mt-4">
          <p>You have no Lora trainings available.</p>
          <Link href="/purchase-lora-training" className="text-blue-500 underline">
            Purchase a new training
          </Link>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default LoraTraining;