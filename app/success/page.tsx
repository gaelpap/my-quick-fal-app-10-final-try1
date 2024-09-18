'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Processing your subscription...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Verify the session and update the user's subscription status
      verifySubscription(sessionId);
    }
  }, [searchParams]);

  const verifySubscription = async (sessionId: string) => {
    try {
      const response = await fetch('/api/verify-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update Firestore
        const userRef = doc(db, 'users', data.userId);
        await updateDoc(userRef, {
          isSubscribed: true,
        });
        setMessage('Subscription successful! You can now generate images.');
      } else {
        setMessage('Failed to verify subscription. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      setMessage('An error occurred. Please try again or contact support.');
    }
  };

  return <div>{message}</div>;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}