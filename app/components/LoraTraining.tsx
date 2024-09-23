'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function LoraTraining() {
  const [loraTrainingsAvailable, setLoraTrainingsAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setLoraTrainingsAvailable(userData?.loraTrainingsAvailable || 0);
      }
    };

    fetchUserData();
  }, []);

  const handleTrainLora = async () => {
    if (loraTrainingsAvailable > 0) {
      setIsLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/train-lora', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          // Add any necessary data for Lora training
          body: JSON.stringify({ /* training data */ }),
        });

        if (!response.ok) {
          throw new Error('Failed to start Lora training');
        }

        setLoraTrainingsAvailable(prev => prev - 1);
        // Handle successful training start
      } catch (error) {
        console.error('Error starting Lora training:', error);
        // Handle error
      } finally {
        setIsLoading(false);
      }
    } else {
      // Redirect to payment page or show payment modal
      router.push('/purchase-lora-training');
    }
  };

  return (
    <div>
      <h2>Lora Training</h2>
      <p>Available trainings: {loraTrainingsAvailable}</p>
      <button onClick={handleTrainLora} disabled={isLoading}>
        {isLoading ? 'Training...' : 'Train Lora Model'}
      </button>
      {loraTrainingsAvailable === 0 && (
        <p>You have no Lora trainings available. Please purchase a new training.</p>
      )}
    </div>
  );
}

export default LoraTraining;