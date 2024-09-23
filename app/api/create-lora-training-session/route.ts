import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Lora training price ID
const LORA_TRAINING_PRICE_ID = 'price_1Q2IxEEI2MwEjNuQfRYyWgRE';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: LORA_TRAINING_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lora-training-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lora-training`,
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Lora training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}