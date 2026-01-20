import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Get in touch with our customer service team
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Customer Service
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Email Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                For general inquiries, billing questions, or technical support:
              </p>
              <a
                href="mailto:support@trackbillables.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-lg font-medium"
              >
                support@trackbillables.com
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Billing & Subscriptions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                For questions about billing, subscriptions, refunds, or cancellations:
              </p>
              <a
                href="mailto:billing@trackbillables.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-lg font-medium"
              >
                billing@trackbillables.com
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Please include your account email address for faster assistance.
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Business Hours
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monday - Friday: 9:00 AM - 5:00 PM PST
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                We are closed on weekends and major US holidays.
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Mailing Address
              </h3>
              <address className="text-gray-600 dark:text-gray-400 not-italic">
                TrackBillables<br />
                123 Legal Plaza<br />
                San Francisco, CA 94105<br />
                United States
              </address>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                How do I cancel my subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You can cancel anytime from your{' '}
                <Link href="/billing" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  billing page
                </Link>
                {' '}by clicking "Manage Subscription" or email us at billing@trackbillables.com.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                What is your refund policy?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Please see our{' '}
                <Link href="/refund-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  refund policy
                </Link>
                {' '}for complete details on refunds and disputes.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                I need technical support. What information should I include?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Please include your account email, a detailed description of the issue, browser/device information, and screenshots if applicable.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-500">
          <p className="mb-2">
            For policy information, see our{' '}
            <Link href="/refund-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Refund Policy
            </Link>
            {' '}and{' '}
            <Link href="/cancellation-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Cancellation Policy
            </Link>
            .
          </p>
          <p>Last updated: January 19, 2026</p>
        </div>
      </div>
    </div>
  );
}
