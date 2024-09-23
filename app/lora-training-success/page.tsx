'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

async function verifyLoraTrainingPurchase(sessionId: string, userId: string) {
  try {
    const response = await fetch('/api/verify-lora-training-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        loraTrainingsAvailable: increment(1)
      });
      return 'Lora training purchase successful! You can now train a new Lora model.';
    } else {
      return 'Failed to verify purchase. Please contact support.';
    }
  } catch (error) {
    console.error('Error verifying Lora training purchase:', error);
    return `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export default function LoraTrainingSuccess() {
  const [message, setMessage] = useState<string>('Verifying purchase...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');

    if (!sessionId) {
      setMessage('Error: No session ID provided. Please contact support.');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const result = await verifyLoraTrainingPurchase(sessionId, user.uid);
        setMessage(result);
        if (result.includes('purchase successful')) {
          setTimeout(() => {
            router.push('/lora-training');
          }, 3000);
        }
      } else {
        setMessage('Error: Authentication required. Please log in and try again.');
      }
    });

    return () => unsubscribe();
  }, [searchParams, router]);

  return (
    <div>
      <h1>Lora Training Purchase Status</h1>
      <p>{message}</p>
    </div>
  );
}