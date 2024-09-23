'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function verifyLoraTrainingPurchase(sessionId: string, userId: string) {
  try {
    console.log('Verifying Lora training purchase:', { sessionId, userId });
    const response = await fetch('/api/verify-lora-training-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Verification result:', result);

    if (result.success) {
      return 'Lora training purchase successful! You can now train a new Lora model.';
    } else {
      return `Failed to verify purchase: ${result.error || 'Unknown error'}`;
    }
  } catch (error) {
    console.error('Error verifying Lora training purchase:', error);
    return `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function LoraTrainingSuccessContent() {
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

export default function LoraTrainingSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoraTrainingSuccessContent />
    </Suspense>
  );
}