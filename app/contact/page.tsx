import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Us
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Support
          </h2>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              For questions, technical support, billing inquiries, or any other assistance:
            </p>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
              <a
                href="mailto:support@trackbillables.com"
                className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                support@trackbillables.com
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              We typically respond within 24-48 hours during business days.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          <p className="mb-2">
            See also:{' '}
            <Link href="/cancellation-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Cancellation Policy
            </Link>
          </p>
          <p>Last updated: January 19, 2026</p>
        </div>
      </div>
    </div>
  );
}
