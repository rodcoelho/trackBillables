import Link from 'next/link';
import HomePageWrapper from '@/components/HomePageWrapper';
import { PRICING } from '@/lib/pricing';

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

        {/* Templates & AI Section */}
        <div className="py-16 lg:py-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Work Smarter, Not Harder
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Save hours every week with reusable templates and AI-powered time estimates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Reusable Templates
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Stop typing the same client, matter, and description over and over. Save your most common billing entries as templates and apply them with one click.
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pre-fill client, matter, hours, and description instantly
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Organize with tags for quick filtering
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Search and apply directly from the entry form
                </li>
              </ul>
            </div>

            {/* AI Estimates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                AI-Powered Estimates
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Let AI analyze your email chains and documents to generate accurate billable hour estimates and work descriptions automatically.
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Paste an email chain and get hours + description
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Upload documents for in-depth time analysis
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Review and adjust before submitting
                </li>
              </ul>
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
                <li>✓ 3 reusable templates</li>
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
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{PRICING.monthly.label}</div>
              <div className="text-gray-600 dark:text-gray-400 mb-4">/month</div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                <li>✓ Unlimited billable entries</li>
                <li>✓ Unlimited exports</li>
                <li>✓ Unlimited templates</li>
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
              <div className="text-4xl font-bold text-white mb-1">{PRICING.annual.label}</div>
              <div className="text-indigo-200 mb-4">/year &mdash; {PRICING.annual.perMonth}/mo, save {PRICING.annual.savings}</div>
              <ul className="space-y-3 text-white mb-6">
                <li>✓ Unlimited billable entries</li>
                <li>✓ Unlimited exports</li>
                <li>✓ Unlimited templates</li>
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
