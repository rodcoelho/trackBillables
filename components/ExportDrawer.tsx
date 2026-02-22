'use client';

import { useState, useEffect } from 'react';
import ClientSelector from '@/components/ClientSelector';
import type { Subscription } from '@/types/database.types';

interface ExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDrawer({ isOpen, onClose }: ExportDrawerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [clientFilter, setClientFilter] = useState('');
  const [clientFilterId, setClientFilterId] = useState<string | null>(null);
  const [matterFilter, setMatterFilter] = useState('');
  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(formatLocalDate(today));
    setStartDate(formatLocalDate(thirtyDaysAgo));
  }, []);

  // Fetch subscription when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchSubscription();
    }
  }, [isOpen]);

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

  // Update filename preview when filters change
  useEffect(() => {
    if (startDate && endDate) {
      const filename = generateFilenamePreview();
      setCustomFilename(filename);
    }
  }, [startDate, endDate, format, clientFilter, matterFilter]);

  const generateFilenamePreview = (): string => {
    const parts: string[] = [];

    if (clientFilter.trim()) {
      parts.push(sanitizeFilename(clientFilter));
    }

    if (matterFilter.trim()) {
      parts.push(sanitizeFilename(matterFilter));
    }

    const startFormatted = formatDateForFilename(startDate);
    const endFormatted = formatDateForFilename(endDate);

    parts.push(`${startFormatted}_${endFormatted}`);

    const extension = format === 'csv' ? 'csv' : 'xlsx';
    return `${parts.join('_')}.${extension}`;
  };

  const sanitizeFilename = (str: string): string => {
    return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  };

  const formatDateForFilename = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  };

  const getUsageText = () => {
    if (!subscription || subscription.tier === 'pro') return null;

    const remaining = 1 - subscription.exports_count_current_month;
    const used = subscription.exports_count_current_month;

    return (
      <div className={`mb-4 px-4 py-3 rounded-lg ${used >= 1 ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
        <div className="flex items-start gap-2">
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${used >= 1 ? 'text-orange-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className={`text-sm font-medium ${used >= 1 ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'}`}>
              {used >= 1 ? '⚠️ Export limit reached' : '📦 Free Tier'}
            </p>
            <p className={`text-xs mt-1 ${used >= 1 ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'}`}>
              {used >= 1 ? (
                <>You've used your 1 free export for this month. <button onClick={() => setShowUpgradePrompt(true)} className="underline font-medium">Upgrade to Pro</button> for unlimited exports!</>
              ) : (
                <>{remaining} export remaining this month</>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleExport = async () => {
    setError(null);

    // Validation
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date');
      return;
    }

    // Check if date range exceeds 6 months
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    if (end > sixMonthsLater) {
      setError('Date range cannot exceed 6 months. Please select a shorter range.');
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          format,
          clientFilter: clientFilter.trim() || undefined,
          clientFilterId: clientFilterId || undefined,
          matterFilter: matterFilter.trim() || undefined,
          customFilename: customFilename.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        // Check if it's an upgrade error
        if (data.upgrade) {
          setShowUpgradePrompt(true);
          throw new Error(data.message);
        }

        throw new Error(data.error || 'Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = customFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh subscription to update count
      await fetchSubscription();

      // Show success message and close drawer
      alert('Export successful! Download started.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Export Billables
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Usage Warning */}
          {getUsageText()}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">CSV</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="xlsx"
                    checked={format === 'xlsx'}
                    onChange={(e) => setFormat(e.target.value as 'xlsx')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Excel (XLSX)</span>
                </label>
              </div>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Client (optional)
              </label>
              <ClientSelector
                value={clientFilter}
                clientId={clientFilterId}
                onChange={(name, id) => { setClientFilter(name); setClientFilterId(id); }}
                required={false}
                placeholder="e.g., Citadel"
              />
            </div>

            {/* Matter Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Matter (optional)
              </label>
              <input
                type="text"
                value={matterFilter}
                onChange={(e) => setMatterFilter(e.target.value)}
                placeholder="e.g., Smith v. Johnson - Discovery"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Custom Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Name
              </label>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Default format: Client_Matter_DDMMYYYY_DDMMYYYY.ext
              </p>
            </div>

            {/* Export Button */}
            <div className="pt-4">
              <button
                onClick={handleExport}
                disabled={isExporting || !startDate || !endDate}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradeModal
          onClose={() => setShowUpgradePrompt(false)}
          message="Upgrade to Pro for unlimited exports!"
        />
      )}
    </>
  );
}

// Reuse UpgradeModal from AddBillableForm
function UpgradeModal({ onClose, message }: { onClose: () => void; message: string }) {
  const handleUpgrade = async (interval: 'month' | 'year') => {
    try {
      const priceId = interval === 'month'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL!;

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
                    $15<span className="text-sm font-normal">/month</span>
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
                  BEST VALUE
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-left">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    $144<span className="text-sm font-normal">/year</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    SAVE 20%
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
