'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyzeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DailyData {
  date: string;
  dayName: string;
  hours: number;
  entries: number;
}

interface AnalyticsData {
  dailyData: DailyData[];
  stats: {
    totalHours: number;
    dailyAverage: number;
    mostProductiveDay: {
      dayName: string;
      date: string;
      hours: number;
    };
    totalEntries: number;
    topClient: {
      client: string;
      hours: number;
    } | null;
  };
}

export default function AnalyzeDrawer({ isOpen, onClose }: AnalyzeDrawerProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/last-7-days');

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

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  // Format chart data with "Today" label
  const getChartData = () => {
    if (!data) return [];

    const today = new Date().toISOString().split('T')[0];

    return data.dailyData.map((day) => ({
      ...day,
      label: day.date === today ? 'Today' : `${day.dayName} ${new Date(day.date).getDate()}`,
    }));
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{formattedDate}</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            {data.hours} hours
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.entries} {data.entries === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      );
    }
    return null;
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
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Last 7 Days – Billing Summary
            </h2>
            <div className="flex gap-2">
              {/* Refresh Button */}
              <button
                onClick={fetchAnalytics}
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
                No billables in the last 7 days.
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

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Most Productive Day */}
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Most Productive Day</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {data.stats.mostProductiveDay.dayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data.stats.mostProductiveDay.hours} hours
                  </p>
                </div>

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

              {/* Bar Chart */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Daily Hours
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="label"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
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
    </>
  );
}
