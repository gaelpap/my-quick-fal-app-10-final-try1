import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, FieldValue } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { sessionId, userId } = await req.json();

    console.log('Verifying Lora training purchase:', { sessionId, userId });

    if (!sessionId || !userId) {
      console.error('Missing sessionId or userId');
      return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
    }

    console.log('Retrieving Stripe session');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session retrieved:', session.payment_status);

    if (session.payment_status === 'paid') {
      console.log('Payment status is paid, updating user document');
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        loraTrainingsAvailable: FieldValue.increment(1)
      });
      console.log('User document updated successfully');

      return NextResponse.json({ success: true });
    } else {
      console.log('Payment not completed');
      return NextResponse.json({ success: false, error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error verifying Lora training purchase:', error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: `Internal server error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}