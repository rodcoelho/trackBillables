'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AddBillableForm from '@/components/AddBillableForm';
import BillablesList, { BillablesListRef } from '@/components/BillablesList';
import SignOutButton from '@/components/SignOutButton';
import ExportDrawer from '@/components/ExportDrawer';
import AnalyzeDrawer from '@/components/AnalyzeDrawer';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              TrackBillables
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
            <SignOutButton />
          </div>
        </div>

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
