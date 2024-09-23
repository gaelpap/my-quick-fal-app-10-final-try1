'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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

  const handlePurchaseTraining = () => {
    router.push('/purchase-lora-training');
  };

  if (loraTrainingsAvailable === null) {
    return <div className="text-black">Loading...</div>;
  }

  if (loraTrainingsAvailable === 0) {
    return (
      <div className="text-black">
        <h2 className="text-2xl font-bold mb-4">Lora Training</h2>
        <p className="mb-4">You have no Lora trainings available.</p>
        <button
          onClick={handlePurchaseTraining}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Purchase a new training
        </button>
      </div>
    );
  }

  // Your existing Lora training component code goes here
  // This should include your file upload, trigger word input, and training logic
  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Lora Training</h2>
      <p className="mb-4">Available trainings: {loraTrainingsAvailable}</p>
      {/* Your existing Lora training form and logic */}
    </div>
  );
}

export default LoraTraining;