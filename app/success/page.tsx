'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      const updateSubscription = async () => {
        try {
          await new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
              unsubscribe();
              if (user) {
                console.log('User authenticated:', user.uid);
                resolve();
              } else {
                console.log('No user found');
                setError('User not found. Please try logging in again.');
                resolve();
              }
            });
          });

          const user = auth.currentUser;
          if (user) {
            console.log('Updating subscription for user:', user.uid);
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              // Create the user document if it doesn't exist
              await setDoc(userDocRef, {
                email: user.email,
                createdAt: new Date().toISOString(),
                isSubscribed: true,
                stripeSessionId: sessionId,
              });
              console.log('User document created and subscription updated');
            } else {
              // Update the existing user document
              await updateDoc(userDocRef, {
                isSubscribed: true,
                stripeSessionId: sessionId,
              });
              console.log('Subscription updated successfully');
            }

            setTimeout(() => {
              router.push('/');
            }, 3000); // Redirect after 3 seconds
          } else {
            console.log('No user found after authentication check');
            setError('User not found after authentication check. Please try logging in again.');
          }
        } catch (error) {
          console.error('Error updating subscription:', error);
          setError(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsUpdating(false);
        }
      };
      updateSubscription();
    } else {
      setError('Invalid session. Please try subscribing again.');
      setIsUpdating(false);
    }
  }, [router, searchParams]);

  return (
    <div className="text-center py-8">
      <h1 className="text-2xl font-bold mb-4">Thank you for subscribing!</h1>
      {isUpdating ? (
        <p>Updating your subscription...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <p>You can now start generating images.</p>
          <p>Redirecting you to the home page in 3 seconds...</p>
        </>
      )}
    </div>
  );
}