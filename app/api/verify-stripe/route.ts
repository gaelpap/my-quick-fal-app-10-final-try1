import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET() {
  try {
    const config = await stripe.config.retrieve();
    return NextResponse.json({ mode: config.environment, apiVersion: stripe.getApiField('version') });
  } catch (error) {
    console.error('Error verifying Stripe configuration:', error);
    return NextResponse.json({ error: 'Failed to verify Stripe configuration' }, { status: 500 });
  }
}