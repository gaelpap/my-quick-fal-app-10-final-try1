'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { stripe } from '@/lib/stripe';

async function verifySubscription(sessionId: string, userId: string) {
  console.log('Verifying subscription for session:', sessionId);
  try {
    console.log('Attempting to retrieve session from Stripe');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Retrieved session:', JSON.stringify(session, null, 2));

    if (session.payment_status === 'paid') {
      console.log('Payment status is paid');
      if (!session.client_reference_id) {
        console.error('No client_reference_id found in session');
        return 'Error: No user reference found';
      }
      
      if (userId !== session.client_reference_id) {
        console.error('User mismatch');
        return 'Error: User mismatch';
      }

      const userRef = doc(db, 'users', userId);
      console.log('Updating user document for:', userId);
      try {
        await setDoc(userRef, { isSubscribed: true }, { merge: true });
        console.log('Updated user document');
        return 'Subscription successful! You can now generate images.';
      } catch (updateError) {
        console.error('Error updating user document:', updateError);
        return `Error updating user document: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
      }
    } else {
      console.log('Payment status is not paid:', session.payment_status);
      return 'Failed to verify subscription. Please contact support.';
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function SuccessContent() {
  const [message, setMessage] = useState<string>('Verifying subscription...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('Session ID from URL:', sessionId);

    if (!sessionId) {
      console.error('No session_id found in search params');
      setMessage('Error: No session ID provided. Please contact support.');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        const result = await verifySubscription(sessionId, user.uid);
        setMessage(result);
      } else {
        console.error('User not authenticated');
        setMessage('Error: Authentication required. Please log in and try again.');
        // Optionally, redirect to login page
        // router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [searchParams, router]);

  return (
    <div>
      <h1>Subscription Status</h1>
      <p>{message}</p>
    </div>
  );
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  console.log('SuccessPage rendered. Session ID:', sessionId);

  if (!sessionId) {
    console.error('No session_id found in SuccessPage');
    return (
      <div>
        <h1>Subscription Status</h1>
        <p>Error: No session ID provided. Please contact support.</p>
        <p>Debug info: {JSON.stringify(Object.fromEntries(searchParams.entries()))}</p>
      </div>
    );
  }

  return <SuccessContent />;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}