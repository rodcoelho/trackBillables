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
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Simple, transparent subscription cancellation
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              At TrackBillables, you have complete control over your subscription. You can cancel your Pro subscription at any time, with no cancellation fees or penalties. This policy explains how cancellations work and what to expect.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              How to Cancel Your Subscription
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There are two ways to cancel your TrackBillables Pro subscription:
            </p>

            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Method 1: Self-Service Cancellation (Recommended)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Log in to your TrackBillables account</li>
                  <li>
                    Navigate to your{' '}
                    <Link href="/billing" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                      Billing page
                    </Link>
                  </li>
                  <li>Click "Manage Subscription"</li>
                  <li>You'll be redirected to the Stripe Customer Portal</li>
                  <li>Click "Cancel subscription" and follow the prompts</li>
                  <li>Confirm your cancellation</li>
                </ol>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                  This is the fastest way to cancel and takes effect immediately.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Method 2: Email Request
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  If you prefer to cancel via email or need assistance:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>
                    Email{' '}
                    <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      billing@trackbillables.com
                    </a>
                  </li>
                  <li>Use the subject line "Cancellation Request"</li>
                  <li>Include your account email address</li>
                  <li>We will process your cancellation within 1 business day</li>
                  <li>You'll receive a confirmation email once processed</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              What Happens After Cancellation
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Immediate Effects
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Your subscription is marked as "Canceled"</li>
                  <li>No further charges will be made to your payment method</li>
                  <li>You will receive a confirmation email</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Access Until End of Billing Period
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  When you cancel, you maintain full Pro access until the end of your current billing period:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>
                    <span className="font-medium">Monthly subscriptions:</span> Access continues until the end of your current month
                  </li>
                  <li>
                    <span className="font-medium">Annual subscriptions:</span> Access continues until the end of your current year
                  </li>
                  <li>All Pro features remain available during this period</li>
                  <li>You can continue to create billable entries and export data</li>
                </ul>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    <span className="font-semibold">Example:</span> If you cancel on January 15 and your billing date is January 20, you'll have Pro access until January 20. If your annual subscription renews on March 1, you'll have Pro access until March 1.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  After Billing Period Ends
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  When your paid period expires:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Your account automatically converts to the Free tier</li>
                  <li>Free tier limits apply: 50 billable entries/month, 1 export/month</li>
                  <li>All your existing data remains intact and accessible</li>
                  <li>You can still log in and use basic features</li>
                  <li>You can re-subscribe to Pro at any time to restore unlimited access</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Data Retention
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Canceling your subscription does not delete your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>All billable entries, clients, and matter information are preserved</li>
              <li>Your account settings and preferences remain unchanged</li>
              <li>Historical data is never deleted due to cancellation</li>
              <li>You can export your data at any time before or after cancellation</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              If you wish to permanently delete your account and all data, please contact{' '}
              <a href="mailto:support@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                support@trackbillables.com
              </a>
              {' '}with a deletion request.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Reactivating Your Subscription
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Changed your mind? You can reactivate your Pro subscription anytime:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Before Billing Period Ends
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  If you're still within your paid period:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Go to your Billing page</li>
                  <li>Click "Manage Subscription"</li>
                  <li>In the Stripe Customer Portal, click "Renew subscription"</li>
                  <li>Your subscription will continue without interruption</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  After Converting to Free Tier
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  If your account has reverted to Free:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>
                    Visit the{' '}
                    <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      Pricing page
                    </Link>
                  </li>
                  <li>Click "Upgrade to Pro"</li>
                  <li>Complete the checkout process</li>
                  <li>Pro features are activated immediately</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Refunds After Cancellation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our refund policy for canceled subscriptions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>
                <span className="font-medium">Within 30 days of initial purchase:</span> Full refund available (see our{' '}
                <Link href="/refund-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Refund Policy
                </Link>
                )
              </li>
              <li>
                <span className="font-medium">Monthly renewals:</span> Refunds available within 7 days of renewal charge
              </li>
              <li>
                <span className="font-medium">Annual renewals:</span> Refunds available within 14 days of renewal charge
              </li>
              <li>
                <span className="font-medium">Partial refunds:</span> Not typically issued, but may be considered on a case-by-case basis
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              For refund requests, email{' '}
              <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                billing@trackbillables.com
              </a>
              {' '}with your account details.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Important Notes
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>
                <span className="font-medium">No cancellation fees:</span> We never charge a fee for canceling your subscription
              </li>
              <li>
                <span className="font-medium">No long-term contracts:</span> All subscriptions are month-to-month or year-to-year with no commitment
              </li>
              <li>
                <span className="font-medium">Cancel anytime:</span> You can cancel at any point during your subscription
              </li>
              <li>
                <span className="font-medium">Automatic renewal prevention:</span> Cancellation stops all future charges
              </li>
              <li>
                <span className="font-medium">Data export:</span> We recommend exporting your data before your Pro access expires
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avoid Unwanted Charges
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              To prevent being charged for the next billing period:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Cancel your subscription <span className="font-semibold">before</span> your renewal date</li>
              <li>Check your Billing page to see your next renewal date</li>
              <li>You'll receive reminder emails before renewals (if notifications are enabled)</li>
              <li>Cancellation is immediate - you don't need to wait until the end of your period</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              If you have questions about canceling your subscription or need assistance:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <span className="font-medium">Billing questions:</span>{' '}
                <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  billing@trackbillables.com
                </a>
              </li>
              <li>
                <span className="font-medium">General support:</span>{' '}
                <a href="mailto:support@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  support@trackbillables.com
                </a>
              </li>
              <li>
                <span className="font-medium">Full contact information:</span>{' '}
                <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Visit our Contact page
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          <p className="mb-2">
            See also:{' '}
            <Link href="/refund-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Refund Policy
            </Link>
            {' '}|{' '}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Contact Us
            </Link>
          </p>
          <p>Last updated: January 19, 2026</p>
        </div>
      </div>
    </div>
  );
}
