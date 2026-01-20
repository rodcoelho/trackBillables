// @ts-nocheck - TODO: Fix type definitions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { getOrCreateStripeCustomer } from '@/lib/stripe/helpers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, billingInterval } = body;

    if (!priceId || (priceId !== STRIPE_CONFIG.priceIds.monthly && priceId !== STRIPE_CONFIG.priceIds.annual)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: origin + '/billing?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/pricing?canceled=true',
      metadata: { user_id: user.id, billing_interval: billingInterval },
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
