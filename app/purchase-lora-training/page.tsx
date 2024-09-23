'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function PurchaseLoraTraining() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-lora-training-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Failed to initiate purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Purchase Lora Training</h1>
      <p className="mb-4">Click the button below to purchase a new Lora training session.</p>
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Purchase Training'}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}