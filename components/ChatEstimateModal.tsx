'use client';

import { useState } from 'react';
import type { Subscription } from '@/types/database.types';

interface ChatEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateGenerated: (hours: number, description: string) => void;
  subscription: Subscription | null;
}

export default function ChatEstimateModal({
  isOpen,
  onClose,
  onEstimateGenerated,
  subscription,
}: ChatEstimateModalProps) {
  const [chatHistory, setChatHistory] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!chatHistory.trim()) {
      setError('Please paste a chat history to analyze.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/chat-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_history: chatHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate estimate');
      }

      onEstimateGenerated(data.billable_hours, data.description);
      onClose();
      setChatHistory('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate estimate. Please try again or enter manually.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Chat Time Estimate
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Paste a chat history to estimate billable hours using AI
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
              htmlFor="chatHistory"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Chat History <span className="text-red-500">*</span>
            </label>
            <textarea
              id="chatHistory"
              value={chatHistory}
              onChange={(e) => setChatHistory(e.target.value)}
              rows={16}
              placeholder={`Paste your AI chat history here...\n\nExample:\nUser: Can you summarize the key obligations under Section 4 of the lease agreement for my client?\n\nAssistant: Based on Section 4 of the lease agreement, your client's key obligations include...\n\nUser: Are there any potential liability issues if the tenant fails to maintain insurance?\n\nAssistant: Yes, there are several liability concerns to consider...`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Include the full chat conversation with all user messages and AI responses for accurate estimation.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !chatHistory.trim()}
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
