import { NextResponse } from 'next/server';

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  console.log('Server-side Stripe Publishable Key:', publishableKey);
  
  if (!publishableKey) {
    console.error('Stripe Publishable Key is not set in environment variables');
    return NextResponse.json({ error: 'Stripe Publishable Key is not set' }, { status: 500 });
  }
  
  if (!publishableKey.startsWith('pk_test_')) {
    console.error('Invalid Stripe Publishable Key format');
    return NextResponse.json({ error: 'Invalid Stripe Publishable Key format' }, { status: 500 });
  }
  
  return NextResponse.json({ publishableKey });
}