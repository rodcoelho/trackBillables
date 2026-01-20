import Link from 'next/link';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Cancellation Policy
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              TrackBillables Pro subscriptions are auto-renewing. You can cancel anytime with no cancellation fees or penalties.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              How to Cancel
            </h2>

            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Self-Service Cancellation
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Log in to your TrackBillables account</li>
                  <li>
                    Go to your{' '}
                    <Link href="/billing" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                      Billing page
                    </Link>
                  </li>
                  <li>Click "Manage Subscription"</li>
                  <li>Click "Cancel subscription" in the Stripe portal</li>
                  <li>Confirm cancellation</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Or Email Us
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Email{' '}
                  <a href="mailto:support@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    support@trackbillables.com
                  </a>{' '}
                  with "Cancel Subscription" in the subject line and we'll process it within 1 business day.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              What Happens When You Cancel
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Access Until Period End
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  When you cancel, you keep full Pro access until the end of your current billing period:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>
                    <span className="font-medium">Monthly subscriptions:</span> Access continues until your monthly renewal date
                  </li>
                  <li>
                    <span className="font-medium">Annual subscriptions:</span> Access continues for all remaining months until your annual renewal date
                  </li>
                  <li>No immediate cutoff</li>
                  <li>All Pro features remain available during this time</li>
                  <li>Your subscription will not auto-renew</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  No Prorated Refunds
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Canceling your subscription stops future billing but does not provide a refund for the remaining time in your current billing period. You paid for access until the end of the period, and you get to use it until then.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  After Your Period Ends
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  When your paid period expires:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Your account converts to the Free tier</li>
                  <li>Free tier limits apply: 50 billable entries/month, 1 export/month</li>
                  <li>All your data remains intact</li>
                  <li>You can still log in and use basic features</li>
                  <li>You can re-subscribe to Pro anytime</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Reactivating Your Subscription
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Before Period Ends
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  If you're still in your paid period, go to your Billing page → "Manage Subscription" → "Renew subscription" to resume auto-renewal.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  After Converting to Free
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Visit the{' '}
                  <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Pricing page
                  </Link>{' '}
                  and click "Upgrade to Pro" to restart your subscription.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Data Retention
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Canceling does not delete your data. All billable entries, clients, and settings are preserved. If you want to permanently delete your account, email{' '}
              <a href="mailto:support@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                support@trackbillables.com
              </a>
              .
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Questions?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contact us at{' '}
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
          <p>Last updated: January 19, 2026</p>
        </div>
      </div>
    </div>
  );
}
