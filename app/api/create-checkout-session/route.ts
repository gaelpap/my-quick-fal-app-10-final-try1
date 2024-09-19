import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: Request) {
  const { userId } = await request.json();
  console.log('Received userId:', userId);

  try {
    // Create a free product if it doesn't exist
    let product = await stripe.products.create({
      name: 'Free Subscription',
    });

    // Create a free price for the product
    let price = await stripe.prices.create({
      product: product.id,
      unit_amount: 0,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const origin = request.headers.get('origin');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      client_reference_id: userId,
    });
    console.log('Created session:', session.id);
    console.log('Success URL:', `${origin}/success?session_id=${session.id}`);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}