'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function LoraTraining() {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setIsSubscribed(userData?.isSubscribed ?? false);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to fetch user data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSubscribe = () => {
    router.push('/subscription');
  };

  if (isLoading) {
    return <div className="text-black">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Lora Training</h2>
      {isSubscribed ? (
        <Link href="/start-lora-training" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Start Lora Training
        </Link>
      ) : (
        <div>
          <p className="mb-4">You need to subscribe to access Lora Training.</p>
          <button
            onClick={handleSubscribe}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  );
}

export default LoraTraining;