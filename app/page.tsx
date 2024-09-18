'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';  // Import auth directly
import { Page } from '@/components/app-page';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed in Home, user:', user?.uid);
      setUser(user);
      setAuthChecked(true);
      if (!user) {
        router.push('/login'); // Redirect to login page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Page />;
  }

  return (
    <div>
      <h1>Welcome to My App</h1>
      <LoginForm />
      <RegisterForm />
    </div>
  );
}
