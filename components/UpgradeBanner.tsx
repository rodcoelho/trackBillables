'use client';

import Link from 'next/link';

export default function UpgradeBanner() {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Unlock unlimited potential with Pro</p>
            <p className="text-sm text-indigo-100">Unlimited entries, exports, and advanced analytics</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
