'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/admin/MetricCard';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On-demand loading states
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/analytics/dashboard?basic=true');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchRevenueData = async () => {
    setRevenueLoading(true);
    try {
      const response = await fetch('/api/admin/analytics/dashboard?revenue=true');
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      const result = await response.json();
      setRevenueData(result.revenue);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      alert('Failed to load revenue data');
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchActivityData = async () => {
    setActivityLoading(true);
    try {
      const response = await fetch('/api/admin/analytics/dashboard?activity=true');
      if (!response.ok) {
        throw new Error('Failed to fetch activity data');
      }
      const result = await response.json();
      setActivityData(result.activity);
    } catch (error) {
      console.error('Error fetching activity data:', error);
      alert('Failed to load activity data');
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your application metrics</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          View All Users
        </Link>
        <Link
          href="/admin/audit-log"
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          View Audit Log
        </Link>
      </div>

      {/* Users Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Users Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={data.totalUsers.toLocaleString()}
            subtitle={`+${data.newUsers.last30Days} this month`}
            trend={
              data.newUsers.growthRate !== 0
                ? {
                    value: Math.abs(data.newUsers.growthRate),
                    isPositive: data.newUsers.growthRate >= 0,
                  }
                : undefined
            }
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <MetricCard
            title="New Users (7d)"
            value={data.newUsers.last7Days.toLocaleString()}
            subtitle="Last 7 days"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          />

          <MetricCard
            title="Free Users"
            value={data.subscriptions.free.count.toLocaleString()}
            subtitle={`${data.subscriptions.free.percentage}% of total`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <MetricCard
            title="Pro Users"
            value={data.subscriptions.pro.count.toLocaleString()}
            subtitle={`${data.subscriptions.pro.percentage}% of total`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Revenue Metrics (On-Demand) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
          <button
            onClick={fetchRevenueData}
            disabled={revenueLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {revenueLoading ? 'Loading...' : revenueData ? 'Refresh' : 'Query Revenue'}
          </button>
        </div>

        {revenueData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="MRR"
              value={`$${revenueData.mrr.toLocaleString()}`}
              subtitle="Monthly Recurring Revenue"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <MetricCard
              title="ARR"
              value={`$${revenueData.arr.toLocaleString()}`}
              subtitle="Annual Recurring Revenue"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
            />

            <MetricCard
              title="This Month"
              value={`$${revenueData.thisMonth.toLocaleString()}`}
              subtitle="Revenue this month"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">Click "Query Revenue" to load revenue metrics</p>
          </div>
        )}
      </div>

      {/* Activity Metrics (On-Demand) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
          <button
            onClick={fetchActivityData}
            disabled={activityLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {activityLoading ? 'Loading...' : activityData ? 'Refresh' : 'Query Activity'}
          </button>
        </div>

        {activityData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <MetricCard
                title="Total Billables"
                value={activityData.totalBillables.toLocaleString()}
                subtitle={`${activityData.billablesLast30Days} in last 30 days`}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />

              <MetricCard
                title="Avg Entries/User"
                value={activityData.avgEntriesPerActiveUser.toFixed(1)}
                subtitle="Per active user (30d)"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />

              <MetricCard
                title="Active Users (30d)"
                value={activityData.activeUsers?.toLocaleString() || 'N/A'}
                subtitle="Signed in last 30 days"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Top Users */}
            {activityData.topUsers && activityData.topUsers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users (Last 30 Days)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Billables
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityData.topUsers.map((user: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.billables}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.tier === 'pro' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">Click "Query Activity" to load activity metrics and top users</p>
          </div>
        )}
      </div>
    </div>
  );
}
