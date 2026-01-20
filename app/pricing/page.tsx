'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import type { Subscription } from '@/types/database.types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PricingPageContent() {
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=/pricing');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, billingInterval }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const isPro = subscription?.tier === 'pro';
  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '';
  const annualPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Simple, transparent pricing for legal professionals
          </p>
        </div>

        {searchParams?.get('canceled') && (
          <div className="mb-8 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-center">
              Checkout was canceled. No charges were made.
            </p>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm inline-flex">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingInterval === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingInterval === 'year'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Annual <span className="text-xs ml-1">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">50 billable entries per month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">1 export per month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Basic analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">CSV & XLSX exports</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-2xl p-8 border-2 border-indigo-400 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  ${billingInterval === 'month' ? '10' : '100'}
                </span>
                <span className="text-indigo-200">
                  /{billingInterval === 'month' ? 'month' : 'year'}
                </span>
              </div>
              {billingInterval === 'year' && (
                <p className="text-indigo-200 text-sm mt-1">$8.33/month billed annually</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">Unlimited billable entries</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">Unlimited exports</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">Advanced analytics & insights</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">Custom export templates</span>
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade(billingInterval === 'month' ? monthlyPriceId : annualPriceId)}
              disabled={loading || isPro}
              className="w-full py-3 px-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isPro ? 'Current Plan' : loading ? 'Loading...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center space-y-4">
          <div>
            <a href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              ← Back to Dashboard
            </a>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-x-3">
            <a href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</a>
            <span>•</span>
            <a href="/refund-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Refund Policy</a>
            <span>•</span>
            <a href="/cancellation-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Cancellation Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
      <PricingPageContent />
    </Suspense>
  );
}
