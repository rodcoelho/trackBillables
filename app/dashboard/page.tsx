'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AddBillableForm from '@/components/AddBillableForm';
import BillablesList, { BillablesListRef } from '@/components/BillablesList';
import ExportDrawer from '@/components/ExportDrawer';
import AnalyzeDrawer from '@/components/AnalyzeDrawer';
import UpgradeBanner from '@/components/UpgradeBanner';
import UserMenu from '@/components/UserMenu';
import type { Subscription } from '@/types/database.types';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);
  const [isAnalyzeDrawerOpen, setIsAnalyzeDrawerOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const billablesListRef = useRef<BillablesListRef>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchSubscription();
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

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

  const handleBillableAdded = () => {
    // Refresh the billables list
    billablesListRef.current?.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span>TrackBillables</span>
              {subscription?.tier === 'pro' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  PRO
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAnalyzeDrawerOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyze
            </button>
            <button
              onClick={() => setIsExportDrawerOpen(true)}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <UserMenu />
          </div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {subscription?.tier !== 'pro' && <UpgradeBanner />}

        {/* Add New Billable Form */}
        <div className="mb-8">
          <AddBillableForm onSuccess={handleBillableAdded} />
        </div>

        {/* Billables List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your Billables
          </h2>
          <BillablesList ref={billablesListRef} />
        </div>
      </div>

      {/* Analyze Drawer */}
      <AnalyzeDrawer
        isOpen={isAnalyzeDrawerOpen}
        onClose={() => setIsAnalyzeDrawerOpen(false)}
      />

      {/* Export Drawer */}
      <ExportDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => setIsExportDrawerOpen(false)}
      />
    </div>
  );
}
