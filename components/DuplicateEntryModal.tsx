'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ClientSelector from '@/components/ClientSelector';
import { PRICING } from '@/lib/pricing';
import type { Billable, Subscription } from '@/types/database.types';

interface DuplicateEntryModalProps {
  billable: Billable;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DuplicateEntryModal({ billable, onClose, onSuccess }: DuplicateEntryModalProps) {
  const [date, setDate] = useState(billable.date);
  const [client, setClient] = useState(billable.client);
  const [clientId, setClientId] = useState<string | null>(billable.client_id);
  const [caseNumber, setCaseNumber] = useState(billable.case_number || '');
  const [matter, setMatter] = useState(billable.matter);
  const [timeAmount, setTimeAmount] = useState(billable.time_amount.toString());
  const [description, setDescription] = useState(billable.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const supabase = createClient();

  // Fetch subscription on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    }
    fetchSubscription();
  }, []);

  const canAddEntry = () => {
    if (!subscription) return false;

    // Pro users can add unlimited
    if (subscription.tier === 'pro' && ['active', 'trialing'].includes(subscription.status)) {
      return true;
    }

    // Free users have 50/month limit
    if (subscription.tier === 'free') {
      return subscription.entries_count_current_month < 50;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user can add entry
    if (!canAddEntry()) {
      setShowUpgradePrompt(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/billables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          client,
          client_id: clientId,
          matter,
          time_amount: parseFloat(timeAmount),
          description: description || null,
          case_number: caseNumber || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an upgrade error
        if (data.upgrade) {
          setShowUpgradePrompt(true);
          throw new Error(data.message);
        }
        throw new Error(data.error || 'Failed to add billable');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate billable');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (interval: 'month' | 'year') => {
    try {
      const priceId = interval === 'month'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SefDaCnzNMpemDjuleE3Rjy'
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL || 'price_1SefDaCnzNMpemDjIl8Hku8y';

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Duplicate Entry
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showUpgradePrompt ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You've reached your free plan limit of 50 entries per month.
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border-2 border-indigo-500">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {PRICING.monthly.label}<span className="text-sm font-normal">/month</span>
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400">
                        {PRICING.monthly.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgrade('month')}
                      className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Choose Monthly
                    </button>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      SAVE 20%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {PRICING.annual.label}<span className="text-sm font-normal">/year</span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {PRICING.annual.perMonth}/month &bull; Save {PRICING.annual.savings}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgrade('year')}
                      className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                      Choose Annual
                    </button>
                  </div>
                </div>
              </div>

              <ul className="text-left space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Unlimited</strong> billable entries</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Unlimited</strong> exports (CSV & Excel)</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Advanced analytics & insights</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support & updates</span>
                </li>
              </ul>

              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div style={{ width: '25%' }}>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Client <span className="text-red-500">*</span>
                  </label>
                  <ClientSelector
                    value={client}
                    clientId={clientId}
                    onChange={(name, id) => { setClient(name); setClientId(id); }}
                    required
                  />
                </div>

                <div style={{ width: '15%' }}>
                  <label
                    htmlFor="dup-caseNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Case #
                  </label>
                  <input
                    type="text"
                    id="dup-caseNumber"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="e.g., 2024-001"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="matter"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Matter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="matter"
                    value={matter}
                    onChange={(e) => setMatter(e.target.value)}
                    required
                    placeholder="e.g., Smith v. Johnson - Discovery"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div style={{ width: '12%' }}>
                  <label
                    htmlFor="timeAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="timeAmount"
                    step="0.1"
                    min="0.1"
                    max="24"
                    value={timeAmount}
                    onChange={(e) => setTimeAmount(e.target.value)}
                    required
                    placeholder="e.g., 1.5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div style={{ width: '18%' }}>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Detailed notes about the work performed..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || !client || !matter || !timeAmount || parseFloat(timeAmount) <= 0 || parseFloat(timeAmount) > 24}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Duplicate Entry'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
