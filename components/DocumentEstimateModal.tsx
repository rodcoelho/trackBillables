'use client';

import { useState } from 'react';
import type { Subscription } from '@/types/database.types';

interface DocumentEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateGenerated: (hours: number, description: string) => void;
  subscription: Subscription | null;
}

export default function DocumentEstimateModal({
  isOpen,
  onClose,
  onEstimateGenerated,
  subscription,
}: DocumentEstimateModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    // Validate file count
    if (selectedFiles.length > 15) {
      setError('Maximum 15 documents allowed');
      return;
    }

    // Validate file sizes (5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    const invalidFiles = selectedFiles.filter(file => file.size > maxSize);

    if (invalidFiles.length > 0) {
      setError(`Some files exceed 5MB limit: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles(selectedFiles);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await fetch('/api/document-estimate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgrade) {
          setShowUpgrade(true);
        }
        throw new Error(data.error || 'Failed to generate estimate');
      }

      // Success - pass the data to parent
      onEstimateGenerated(data.billable_hours, data.description);

      // Reset and close
      setFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate estimate');
    } finally {
      setGenerating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  if (showUpgrade) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Upgrade to Pro
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AI Document Estimate is a Pro-only feature. Upgrade to access this and other premium features.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpgrade(false)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Document Estimate
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload up to 15 documents for AI-powered billable time estimation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Documents
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileChange}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  PDF, DOC, DOCX, TXT, RTF up to 5MB each (max 15 files)
                </p>
              </label>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Documents ({files.length}/15)
                </p>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How It Works
            </h3>
            <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
              <li>• AI analyzes document length, complexity, and content</li>
              <li>• Estimates time for reading, reviewing, and legal analysis</li>
              <li>• Rounds to 0.1-hour (6-minute) increments</li>
              <li>• Returns total billable hours with detailed breakdown</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={generating}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || files.length === 0}
              className="flex-1 px-4 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Generate Estimate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
