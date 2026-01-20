// @ts-nocheck - TODO: Fix type definitions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/config';
import { syncSubscriptionToSupabase } from '@/lib/stripe/helpers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session.subscription) {
      return NextResponse.json({ error: 'No subscription found in session' }, { status: 400 });
    }

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Sync to Supabase
    await syncSubscriptionToSupabase(subscription, user.id);

    return NextResponse.json({ success: true, subscription: { id: subscription.id, status: subscription.status } });
  } catch (error: any) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
