import { Suspense } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { stripe } from '@/lib/stripe';

async function verifySubscription(sessionId: string) {
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
      
      // Ensure the user is authenticated
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser ? currentUser.uid : 'No user');
      if (!currentUser || currentUser.uid !== session.client_reference_id) {
        console.error('User not authenticated or mismatch');
        return 'Error: Authentication required';
      }

      const userRef = doc(db, 'users', session.client_reference_id);
      console.log('Updating user document for:', session.client_reference_id);
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

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  console.log('Received search params:', searchParams);
  const sessionId = searchParams.session_id;
  if (!sessionId) {
    console.error('No session_id found in search params');
    return <div>Error: No session ID provided</div>;
  }
  const message = await verifySubscription(sessionId);

  return (
    <div>
      <h1>Subscription Status</h1>
      <p>{message}</p>
    </div>
  );
}