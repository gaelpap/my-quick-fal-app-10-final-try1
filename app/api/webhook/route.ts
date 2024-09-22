import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, db } from '@/lib/firebase-admin';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log('Webhook received');
  const buf = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('Webhook verified');
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log('✅ Success:', event.id, 'Event type:', event.type);

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription as string;

    console.log(`💰 Checkout session completed for user: ${userId}`);

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;

      console.log(`🏷️  Subscription price ID: ${priceId}`);

      if (userId) {
        const userRef = db.collection('users').doc(userId);
        
        if (priceId === 'price_1Q1qMUEI2MwEjNuQm64hm1gc') {
          await userRef.update({ isSubscribed: true });
          console.log('✅ Updated user subscription status for Image Generator');
        } else if (priceId === 'price_1Q1qDaEI2MwEjNuQ9Ol8x4xV') {
          await userRef.update({ isLoraTrainingSubscribed: true });
          console.log('✅ Updated user subscription status for Lora Training');
        } else {
          console.log(`⚠️  Unknown price ID: ${priceId}`);
        }

        // Verify the update
        const updatedUserDoc = await userRef.get();
        const updatedUserData = updatedUserDoc.data();
        console.log('📄 Updated user data:', updatedUserData);
      } else {
        console.log('⚠️  No userId found in session');
      }
    } catch (error) {
      console.error('❌ Error processing event:', error);
    }
  }

  return NextResponse.json({ received: true });
}