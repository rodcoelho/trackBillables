import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Refund & Dispute Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Our commitment to fair billing practices
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Refund Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              At TrackBillables, we want you to be completely satisfied with our service. This policy outlines our refund procedures for Pro subscriptions.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              30-Day Money-Back Guarantee
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              If you are not satisfied with TrackBillables Pro for any reason, you may request a full refund within 30 days of your initial subscription purchase. This applies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>First-time Pro monthly subscriptions ($10/month)</li>
              <li>First-time Pro annual subscriptions ($100/year)</li>
              <li>Upgrades from Free to Pro tier</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Refund Eligibility
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              To be eligible for a refund, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Request the refund within 30 days of your initial purchase</li>
              <li>Contact us at <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">billing@trackbillables.com</a></li>
              <li>Provide your account email address and reason for the refund</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Refunds are processed within 5-10 business days and will be credited to the original payment method.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Renewal Refunds
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              For subscription renewals (after your initial subscription period):
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Monthly renewals: Refunds available within 7 days of renewal charge</li>
              <li>Annual renewals: Refunds available within 14 days of renewal charge</li>
              <li>Partial refunds may be issued at our discretion for annual plans</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              To avoid unwanted renewal charges, please cancel your subscription before your renewal date. See our{' '}
              <Link href="/cancellation-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Cancellation Policy
              </Link>
              {' '}for details.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Non-Refundable Situations
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Refunds will not be issued in the following cases:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Refund requests made after the applicable refund period</li>
              <li>Account termination due to violation of our Terms of Service</li>
              <li>Partial month or year refunds for active subscriptions (except at our discretion)</li>
              <li>Free tier accounts (no payment required)</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Dispute Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you believe you have been incorrectly charged or have concerns about your billing, we encourage you to contact us directly before initiating a chargeback.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Billing Disputes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              If you see a charge from TrackBillables that you don't recognize or believe is incorrect:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Email us immediately at <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">billing@trackbillables.com</a></li>
              <li>Include your account email, transaction date, and amount charged</li>
              <li>Describe the issue in detail</li>
              <li>We will investigate and respond within 2-3 business days</li>
            </ol>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Most billing issues can be resolved quickly through direct communication. We will work with you to resolve any legitimate disputes fairly.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Chargebacks
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              If you initiate a chargeback without first contacting us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Your account may be immediately suspended pending investigation</li>
              <li>We will provide documentation to your bank/card issuer showing the legitimate nature of the charge</li>
              <li>Fraudulent chargebacks may result in permanent account termination</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              We always prefer to work directly with customers to resolve billing concerns. Please reach out to us first.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Duplicate Charges
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              If you were accidentally charged twice or received duplicate charges, we will issue a full refund for the duplicate charge immediately upon verification. Please contact <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">billing@trackbillables.com</a> with details.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              How to Request a Refund
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-400 ml-4">
              <li>
                Send an email to <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">billing@trackbillables.com</a> with the subject line "Refund Request"
              </li>
              <li>Include your account email address registered with TrackBillables</li>
              <li>Specify the transaction date and amount</li>
              <li>Provide a brief reason for the refund request (optional but helpful)</li>
              <li>We will review your request and respond within 2 business days</li>
              <li>If approved, refunds are processed within 5-10 business days</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Questions?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              If you have any questions about our refund or dispute policy, please don't hesitate to contact us:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:billing@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  billing@trackbillables.com
                </a>
              </li>
              <li>
                <span className="font-medium">General Support:</span>{' '}
                <a href="mailto:support@trackbillables.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  support@trackbillables.com
                </a>
              </li>
              <li>
                <span className="font-medium">Full Contact Info:</span>{' '}
                <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Visit our Contact page
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          <p className="mb-2">
            See also: {' '}
            <Link href="/cancellation-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Cancellation Policy
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
