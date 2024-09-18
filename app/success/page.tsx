import { Suspense } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { stripe } from '@/lib/stripe';

async function verifySubscription(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const userRef = doc(db, 'users', session.client_reference_id as string);
      await updateDoc(userRef, {
        isSubscribed: true,
      });
      return 'Subscription successful! You can now generate images.';
    } else {
      return 'Failed to verify subscription. Please contact support.';
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return 'An error occurred. Please try again or contact support.';
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  const sessionId = searchParams.session_id;
  const message = await verifySubscription(sessionId);

  return (
    <div>
      <h1>Subscription Status</h1>
      <p>{message}</p>
    </div>
  );
}