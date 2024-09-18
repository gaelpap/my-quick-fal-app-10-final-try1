'use client'

import { useEffect, useState } from 'react';
import { Page } from '@/components/app-page';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Page />;
}
