'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Subscription } from '@/types/database.types';
import Link from 'next/link';

function BillingPageContent() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [templatesCount, setTemplatesCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    checkUser();

    // If returning from successful checkout, sync subscription
    const sessionId = searchParams?.get('session_id');
    if (sessionId && searchParams?.get('success')) {
      syncSubscriptionFromCheckout(sessionId);
    }
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      await fetchSubscription();
      await fetchTemplatesCount();
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplatesCount = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplatesCount(data.templates?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch templates count:', err);
    }
  };

  const syncSubscriptionFromCheckout = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        // Refresh subscription data after sync
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Failed to sync subscription:', err);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      alert('Failed to open billing portal. Please try again.');
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isPro = subscription?.tier === 'pro';
  const isActive = subscription?.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your subscription and billing</p>
        </div>

        {searchParams?.get('success') && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              🎉 Welcome to Pro! Your subscription is now active.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Current Plan</h2>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${isPro ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {isPro ? 'Pro' : 'Free'}
                </span>
                {isPro && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {subscription?.status?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {!isPro ? (
              <Link
                href="/pricing"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Upgrade to Pro
              </Link>
            ) : (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Entries This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscription?.entries_count_current_month || 0}
                {!isPro && <span className="text-sm text-gray-500"> / 50</span>}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exports This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscription?.exports_count_current_month || 0}
                {!isPro && <span className="text-sm text-gray-500"> / 1</span>}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {templatesCount}
                {isPro
                  ? <span className="text-sm text-gray-500"> / &infin;</span>
                  : <span className="text-sm text-gray-500"> / 3</span>
                }
              </p>
            </div>
          </div>
        </div>

        {isPro && subscription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subscription Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Billing Interval</dt>
                <dd className="font-medium text-gray-900 dark:text-white capitalize">
                  {subscription.billing_interval || 'N/A'}ly
                </dd>
              </div>
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">
                    {subscription.cancel_at_period_end ? 'Cancels On' : 'Next Billing Date'}
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {subscription.cancel_at_period_end && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your subscription will be canceled at the end of the current billing period.{subscription.current_period_end && ` You'll still have access until ${new Date(subscription.current_period_end).toLocaleDateString()}.`}
                  </p>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
          <a href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</a>
          <span>•</span>
          <a href="/cancellation-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Cancellation Policy</a>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
      <BillingPageContent />
    </Suspense>
  );
}
