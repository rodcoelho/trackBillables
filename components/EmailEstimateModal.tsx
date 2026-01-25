'use client';

import { useState, useEffect } from 'react';
import type { Subscription } from '@/types/database.types';

interface EmailEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateGenerated: (hours: number, description: string) => void;
  subscription: Subscription | null;
}

export default function EmailEstimateModal({
  isOpen,
  onClose,
  onEstimateGenerated,
  subscription,
}: EmailEstimateModalProps) {
  const [attorneyEmail, setAttorneyEmail] = useState('');
  const [emailChain, setEmailChain] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && subscription?.attorney_email) {
      setAttorneyEmail(subscription.attorney_email);
    }
  }, [isOpen, subscription]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!attorneyEmail.trim() || !emailChain.trim()) {
      setError('Please provide both your attorney email and the email chain.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/email-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attorney_email: attorneyEmail,
          email_chain: emailChain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate estimate');
      }

      // Call the callback with the generated estimate
      onEstimateGenerated(data.billable_hours, data.description);

      // Close modal
      onClose();

      // Reset form
      setEmailChain('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate estimate. Please try again or enter manually.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Time Estimate
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Paste an email chain to estimate billable hours using AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="attorneyEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Attorney Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="attorneyEmail"
              value={attorneyEmail}
              onChange={(e) => setAttorneyEmail(e.target.value)}
              placeholder="attorney@lawfirm.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This email is used to identify which messages in the chain were written by you. It will be saved for future use.
            </p>
          </div>

          <div>
            <label
              htmlFor="emailChain"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Chain <span className="text-red-500">*</span>
            </label>
            <textarea
              id="emailChain"
              value={emailChain}
              onChange={(e) => setEmailChain(e.target.value)}
              rows={16}
              placeholder="Paste the entire email thread here, including all messages, subjects, and timestamps...

Example:
From: client@example.com
To: attorney@lawfirm.com
Subject: Contract Review
Date: Jan 15, 2026

Hi Attorney,

Can you review the attached contract?

Thanks,
Client

---

From: attorney@lawfirm.com
To: client@example.com
Subject: Re: Contract Review
Date: Jan 15, 2026

I'll review it and get back to you by tomorrow.

Best,
Attorney"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Include the full email thread with all messages, subjects, and timestamps for accurate estimation.
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-indigo-800 dark:text-indigo-200">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-indigo-700 dark:text-indigo-300">
                  <li>AI analyzes the email chain to estimate billable time</li>
                  <li>Considers reading, reviewing, researching, and drafting time</li>
                  <li>Rounds to 0.1-hour (6-minute) increments</li>
                  <li>Only counts attorney work (your emails and responses)</li>
                  <li>Results populate the form above for you to review and edit</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !attorneyEmail.trim() || !emailChain.trim()}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Estimate...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate Billable Estimate
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={generating}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
