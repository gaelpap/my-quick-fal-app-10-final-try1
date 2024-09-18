import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Update this to the latest API version
});

export async function POST(req: Request) {
  const { userId } = await req.json();

  try {
    // Create a free product if it doesn't exist
    let product = await stripe.products.create({
      name: 'Free Monthly Subscription',
    });

    // Create a free price for the product
    let price = await stripe.prices.create({
      product: product.id,
      unit_amount: 0,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}