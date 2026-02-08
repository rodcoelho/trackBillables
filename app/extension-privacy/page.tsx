import Link from 'next/link';

export default function ExtensionPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Chrome Extension Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            TrackBillables New Tab — Chrome Extension
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The TrackBillables New Tab extension for Google Chrome is designed with your privacy in mind. This policy explains what the extension does, what data it accesses, and how your information is handled.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              What the Extension Does
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The extension performs a single function: it replaces your browser's default new tab page with a redirect to{' '}
              <a href="https://trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                trackbillables.com
              </a>
              . When you open a new tab, you are taken directly to TrackBillables instead of Chrome's default new tab page.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              That's it. The extension contains no other functionality.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Data Collection
            </h2>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800 mb-4">
              <p className="text-gray-900 dark:text-white font-semibold text-lg">
                This extension collects no data whatsoever.
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Specifically, the extension does <span className="font-medium">not</span>:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Collect, store, or transmit any personal information</li>
              <li>Track your browsing history or activity</li>
              <li>Read or modify content on any web page</li>
              <li>Access cookies, passwords, or authentication tokens</li>
              <li>Send any data to third-party servers or analytics services</li>
              <li>Run any background processes</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Permissions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              The extension requires no special browser permissions. The only capability it uses is Chrome's new tab override, which replaces the default new tab page with our redirect. It does not request access to your tabs, browsing data, history, or any other browser APIs.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The extension itself does not integrate with or send data to any third-party services. Once you are redirected to trackbillables.com, the website's own{' '}
              <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                privacy practices
              </Link>{' '}
              apply as you interact with the TrackBillables web application.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              If we make changes to this privacy policy, the updated version will be posted on this page with a revised date below. The extension's core behavior — a simple new tab redirect with no data collection — is not expected to change.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Questions?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              If you have any questions about this privacy policy or the extension, contact us at{' '}
              <a href="mailto:support@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                support@trackbillables.com
              </a>{' '}
              or visit our{' '}
              <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>Last updated: February 7, 2026</p>
        </div>
      </div>
    </div>
  );
}
