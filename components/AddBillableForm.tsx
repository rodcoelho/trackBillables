'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import TemplateSelector from '@/components/TemplateSelector';
import { PRICING } from '@/lib/pricing';
import type { Subscription, TemplateWithTags } from '@/types/database.types';

interface AddBillableFormProps {
  onSuccess?: () => void;
  prefilledHours?: number;
  prefilledDescription?: string;
  prefilledClient?: string;
  prefilledMatter?: string;
  onEmailEstimateClick?: () => void;
  onDocumentEstimateClick?: () => void;
  showAiEstimate?: boolean;
  isPro?: boolean;
  onTemplateApply?: (template: TemplateWithTags) => void;
}

export default function AddBillableForm({ onSuccess, prefilledHours, prefilledDescription, prefilledClient, prefilledMatter, onEmailEstimateClick, onDocumentEstimateClick, showAiEstimate, isPro, onTemplateApply }: AddBillableFormProps) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [client, setClient] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [matter, setMatter] = useState('');
  const [timeAmount, setTimeAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("You've reached your free plan limit of 50 entries per month.");
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const supabase = createClient();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Update form when prefilled values change (from email estimate or template)
  useEffect(() => {
    if (prefilledHours !== undefined) {
      setTimeAmount(prefilledHours.toString());
    }
    if (prefilledDescription !== undefined) {
      setDescription(prefilledDescription);
    }
  }, [prefilledHours, prefilledDescription]);

  useEffect(() => {
    if (prefilledClient !== undefined) {
      setClient(prefilledClient);
    }
  }, [prefilledClient]);

  useEffect(() => {
    if (prefilledMatter !== undefined) {
      setMatter(prefilledMatter);
    }
  }, [prefilledMatter]);

  // Auto-resize description textarea
  useEffect(() => {
    const textarea = descriptionRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set new height based on content, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 96), 288); // 96px = 4 rows, 288px = 12 rows (3x)
      textarea.style.height = `${newHeight}px`;
    }
  }, [description]);

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
      setUpgradeMessage("You've reached your free plan limit of 50 entries per month.");
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
          setUpgradeMessage("You've reached your free plan limit of 50 entries per month.");
          setShowUpgradePrompt(true);
          throw new Error(data.message);
        }
        throw new Error(data.error || 'Failed to add billable');
      }

      // Reset form
      setClient('');
      setCaseNumber('');
      setMatter('');
      setTimeAmount('');
      setDescription('');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);

      // Refresh subscription to update count
      const subResponse = await fetch('/api/subscription');
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add billable');
    } finally {
      setSaving(false);
    }
  };

  const getUsageText = () => {
    if (!subscription || subscription.tier === 'pro') return null;

    const remaining = 50 - subscription.entries_count_current_month;
    const isNearLimit = remaining <= 10;

    return (
      <div className={`text-sm mb-4 ${isNearLimit ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
        📊 {remaining} of 50 entries remaining this month
        {isNearLimit && ' - '}
        {isNearLimit && (
          <button
            type="button"
            onClick={() => { setUpgradeMessage("You've reached your free plan limit of 50 entries per month."); setShowUpgradePrompt(true); }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Upgrade to Pro for unlimited
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {getUsageText()}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div style={{ width: '25%' }}>
              <label
                htmlFor="client"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                required
                placeholder="e.g., Smith"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div style={{ width: '15%' }}>
              <label
                htmlFor="caseNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Case #
              </label>
              <input
                type="text"
                id="caseNumber"
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
              ref={descriptionRef}
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed notes about the work performed..."
              style={{ minHeight: '96px', maxHeight: '288px' }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none overflow-y-auto"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {showAiEstimate && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAiDropdown(!showAiDropdown)}
                  className="px-4 py-3 bg-purple-600 text-white font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Estimate
                  <svg className={`w-4 h-4 transition-transform ${showAiDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAiDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAiDropdown(false)}
                    />
                    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAiDropdown(false);
                          if (isPro) {
                            onEmailEstimateClick?.();
                          } else {
                            setUpgradeMessage('AI Email Estimates are a Pro feature. Upgrade to analyze email chains and auto-fill billable entries.');
                            setShowUpgradePrompt(true);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 ${isPro ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <svg className={`w-5 h-5 ${isPro ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <div className={`font-medium ${isPro ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Email</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Analyze email chains</div>
                        </div>
                        {!isPro && (
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">PRO</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAiDropdown(false);
                          if (isPro) {
                            onDocumentEstimateClick?.();
                          } else {
                            setUpgradeMessage('AI Document Estimates are a Pro feature. Upgrade to upload documents and auto-fill billable entries.');
                            setShowUpgradePrompt(true);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${isPro ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <svg className={`w-5 h-5 ${isPro ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1">
                          <div className={`font-medium ${isPro ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Document</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Upload up to 15 docs</div>
                        </div>
                        {!isPro && (
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">PRO</span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {onTemplateApply && (
              <TemplateSelector
                onSelect={(template) => onTemplateApply(template)}
              />
            )}
            <button
              type="submit"
              disabled={saving || !client || !matter || !timeAmount || parseFloat(timeAmount) <= 0 || parseFloat(timeAmount) > 24}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Adding...' : 'Add Billable Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradeModal
          onClose={() => setShowUpgradePrompt(false)}
          message={upgradeMessage}
        />
      )}
    </>
  );
}

// Upgrade Modal Component
function UpgradeModal({ onClose, message }: { onClose: () => void; message: string }) {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upgrade to Pro
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Pricing Options */}
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
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
