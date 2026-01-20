import { stripe } from './config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Creates or retrieves a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const adminClient = createAdminClient();

  // Check if user already has a Stripe customer ID
  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Update the subscription record with the customer ID
  await adminClient
    .from('subscriptions')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}

/**
 * Syncs Stripe subscription data to Supabase
 */
export async function syncSubscriptionToSupabase(
  stripeSubscription: any,
  userId?: string
): Promise<void> {
  const adminClient = createAdminClient();

  // If userId is not provided, get it from customer metadata
  let targetUserId = userId;
  if (!targetUserId) {
    const customer = await stripe.customers.retrieve(
      stripeSubscription.customer as string
    );
    if ('metadata' in customer) {
      targetUserId = customer.metadata.supabase_user_id;
    }
  }

  if (!targetUserId) {
    throw new Error('Could not determine user ID for subscription sync');
  }

  const subscriptionData = {
    user_id: targetUserId,
    stripe_customer_id: stripeSubscription.customer as string,
    stripe_subscription_id: stripeSubscription.id,
    stripe_price_id: stripeSubscription.items.data[0]?.price.id || null,
    tier: 'pro' as const,
    status: stripeSubscription.status,
    billing_interval: stripeSubscription.items.data[0]?.plan.interval || 'month',
    current_period_start: new Date(
      stripeSubscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      stripeSubscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    canceled_at: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000).toISOString()
      : null,
    trial_end: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  // Upsert subscription in Supabase (create if doesn't exist, update if it does)
  const { error } = await adminClient
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error syncing subscription to Supabase:', error);
    throw error;
  }
}

/**
 * Cancels a subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string
): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivates a canceled subscription
 */
export async function reactivateSubscription(
  stripeSubscriptionId: string
): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Handles subscription cancellation (immediate or at period end)
 */
export async function handleSubscriptionCanceled(
  stripeSubscription: any
): Promise<void> {
  const adminClient = createAdminClient();

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(
    stripeSubscription.customer as string
  );

  let userId: string | undefined;
  if ('metadata' in customer) {
    userId = customer.metadata.supabase_user_id;
  }

  if (!userId) {
    console.error('Could not find user ID for canceled subscription');
    return;
  }

  // Update subscription to free tier
  await adminClient
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      canceled_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}
