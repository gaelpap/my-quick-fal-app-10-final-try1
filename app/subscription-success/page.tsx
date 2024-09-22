'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SubscriptionSuccessContent: React.FC = () => {
  const [message, setMessage] = useState('Verifying your subscription...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams?.get('session_id');
      if (!sessionId) {
        setMessage('Invalid session. Please try again.');
        return;
      }

      let retries = 0;
      const maxRetries = 5;

      const checkSubscription = async (user: any) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.isSubscribed || userData?.isLoraTrainingSubscribed) {
            setMessage('Subscription successful! Redirecting to app selection...');
            setTimeout(() => router.push('/'), 3000);
          } else {
            if (retries < maxRetries) {
              retries++;
              setMessage(`Subscription not yet reflected. Retrying... (Attempt ${retries}/${maxRetries})`);
              setTimeout(() => checkSubscription(user), 5000); // Wait 5 seconds before retrying
            } else {
              setMessage('Subscription update is taking longer than expected. Please contact support if this persists.');
            }
          }
        } catch (error) {
          console.error('Error verifying subscription:', error);
          setMessage('Error verifying subscription. Please contact support.');
        }
      };

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          checkSubscription(user);
        } else {
          setMessage('User not authenticated. Redirecting to login...');
          setTimeout(() => router.push('/login'), 3000);
        }
      });

      return () => unsubscribe();
    };

    verifySubscription();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Subscription Status</h1>
        <p>{message}</p>
      </div>
    </div>
  );
};

const SubscriptionSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
};

export default SubscriptionSuccessPage;