import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        loraTrainingsAvailable: db.FieldValue.increment(1)
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error verifying Lora training purchase:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}