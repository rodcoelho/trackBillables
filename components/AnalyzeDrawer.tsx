'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PRICING } from '@/lib/pricing';

type Period = '7days' | 'month' | 'year';

interface AnalyzeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
}

interface ChartDataPoint {
  label: string;
  date: string;
  hours: number;
  entries: number;
}

interface AnalyticsData {
  period: string;
  chartData: ChartDataPoint[];
  stats: {
    totalHours: number;
    dailyAverage: number;
    totalEntries: number;
    mostProductiveDay: {
      dayName: string;
      date: string;
      hours: number;
    } | null;
    topClient: {
      client: string;
      hours: number;
    } | null;
  };
}

export default function AnalyzeDrawer({ isOpen, onClose, isPro }: AnalyzeDrawerProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('7days');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchAnalytics = async (p: Period = period) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/summary?period=${p}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod !== '7days' && !isPro) {
      setShowUpgradeModal(true);
      return;
    }
    setPeriod(newPeriod);
    fetchAnalytics(newPeriod);
  };

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      setPeriod('7days');
      fetchAnalytics('7days');
    }
  }, [isOpen]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{d.label}</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            {d.hours} hours
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {d.entries} {d.entries === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleUpgrade = async (interval: 'month' | 'year') => {
    try {
      const priceId = interval === 'month'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL;

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  if (!isOpen) return null;

  const periodLabels: Record<Period, string> = {
    '7days': 'Last 7 Days',
    'month': 'This Month',
    'year': 'This Year',
  };

  const chartTitle: Record<Period, string> = {
    '7days': 'Daily Hours',
    'month': 'Weekly Hours',
    'year': 'Monthly Hours',
  };

  const emptyMessage: Record<Period, string> = {
    '7days': 'No billables in the last 7 days.',
    'month': 'No billables this month.',
    'year': 'No billables this year.',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Billing Summary
            </h2>
            <div className="flex gap-2">
              {/* Refresh Button */}
              <button
                onClick={() => fetchAnalytics()}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                title="Refresh data"
              >
                <svg
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Period Toggle */}
          <div className="flex gap-2 mb-6">
            {(['7days', 'month', 'year'] as Period[]).map((p) => {
              const isActive = period === p;
              const isLocked = p !== '7days' && !isPro;

              return (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : isLocked
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {periodLabels[p]}
                  {isLocked && (
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full">PRO</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && data && data.stats.totalEntries === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
                {emptyMessage[period]}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Time to get to work!
              </p>
            </div>
          )}

          {/* Analytics Content */}
          {!loading && data && data.stats.totalEntries > 0 && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Hours */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Total Hours</p>
                  <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                    {data.stats.totalHours}
                  </p>
                </div>

                {/* Daily Average */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Daily Average</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {data.stats.dailyAverage}
                  </p>
                </div>

                {/* Total Entries */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Entries</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {data.stats.totalEntries}
                  </p>
                </div>
              </div>

              {/* Additional Stats — only for 7-day view */}
              {period === '7days' && (data.stats.mostProductiveDay || data.stats.topClient) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Most Productive Day */}
                  {data.stats.mostProductiveDay && (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Most Productive Day</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {data.stats.mostProductiveDay.dayName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {data.stats.mostProductiveDay.hours} hours
                      </p>
                    </div>
                  )}

                  {/* Top Client */}
                  {data.stats.topClient && (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Top Client</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {data.stats.topClient.client}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {data.stats.topClient.hours} hours
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bar Chart */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {chartTitle[period]}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="label"
                      className="text-xs"
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="hours"
                      fill="#4F46E5"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
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
                Monthly and yearly billing summaries are a Pro feature. Upgrade for extended analytics.
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
                      SAVE {PRICING.annual.savings}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {PRICING.annual.label}<span className="text-sm font-normal">/year</span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {PRICING.annual.perMonth}/month · {PRICING.annual.description}
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

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
