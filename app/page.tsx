import Link from 'next/link';
import HomePageWrapper from '@/components/HomePageWrapper';

export default function HomePage() {
  return (
    <HomePageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                TrackBillables
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Login / Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Track Your Billable Hours
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">
              Simply and Efficiently
            </span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Built for legal professionals who need a straightforward way to track billable time,
            manage clients, and export reports.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-600 dark:hover:border-indigo-400 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="py-16 lg:py-24">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Time Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Log billable hours with client names, matter numbers, and detailed descriptions.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View your billable hours, revenue, and productivity trends at a glance.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Export Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Export your billable entries to CSV or XLSX for invoicing and record-keeping.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Teaser */}
        <div className="py-16 text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h4>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">$0</div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                <li>✓ 50 billable entries/month</li>
                <li>✓ 1 export per month</li>
                <li>✓ Basic analytics</li>
              </ul>
              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro Monthly</h4>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$15</div>
              <div className="text-gray-600 dark:text-gray-400 mb-4">/month</div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                <li>✓ Unlimited billable entries</li>
                <li>✓ Unlimited exports</li>
                <li>✓ Advanced analytics</li>
                <li>✓ AI-powered billable hour estimates</li>
                <li>✓ Priority support</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-center"
              >
                Get Pro
              </Link>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-8 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  BEST VALUE
                </span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Pro Annual</h4>
              <div className="text-4xl font-bold text-white mb-1">$144</div>
              <div className="text-indigo-200 mb-4">/year &mdash; $12/mo, save 20%</div>
              <ul className="space-y-3 text-white mb-6">
                <li>✓ Unlimited billable entries</li>
                <li>✓ Unlimited exports</li>
                <li>✓ Advanced analytics</li>
                <li>✓ AI-powered billable hour estimates</li>
                <li>✓ Priority support</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full py-3 px-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-50 transition-colors text-center"
              >
                Get Pro
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-x-4">
              <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Contact
              </Link>
              <span>•</span>
              <Link href="/cancellation-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Cancellation Policy
              </Link>
              <span>•</span>
              <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Pricing
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2026 TrackBillables. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </HomePageWrapper>
  );
}
