'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '';

type Screen =
  | 'CHECKING_AUTH'
  | 'LOGIN'
  | 'CODE_SENT'
  | 'READY'
  | 'ESTIMATING'
  | 'ESTIMATE_RESULT'
  | 'CREATING'
  | 'SUCCESS'
  | 'ERROR';

type Client = { id: string; name: string };

declare const Office: any;

export default function TaskPane() {
  const [screen, setScreen] = useState<Screen>('CHECKING_AUTH');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);

  // Estimate form state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [matter, setMatter] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Success state
  const [createdEntry, setCreatedEntry] = useState<any>(null);

  const [officeReady, setOfficeReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize Office.js
  useEffect(() => {
    if (typeof Office !== 'undefined') {
      Office.onReady(() => {
        setOfficeReady(true);
      });
    } else {
      // Running outside Outlook (dev/testing)
      setOfficeReady(true);
    }
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    if (!officeReady) return;
    const stored = localStorage.getItem('tb_outlook_token');
    if (stored) {
      validateToken(stored);
    } else {
      setScreen('LOGIN');
    }
  }, [officeReady]);

  async function validateToken(t: string) {
    try {
      const res = await fetch(`${API_BASE}/api/outlook/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      if (data.valid) {
        setToken(t);
        setEmail(data.user.email);
        setScreen('READY');
        fetchClients(t);
      } else {
        localStorage.removeItem('tb_outlook_token');
        setScreen('LOGIN');
      }
    } catch {
      localStorage.removeItem('tb_outlook_token');
      setScreen('LOGIN');
    }
  }

  async function fetchClients(t: string) {
    try {
      const res = await fetch(`${API_BASE}/api/outlook/clients`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch {
      // Non-critical, client can type manually
    }
  }

  async function handleSendCode() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/outlook/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setScreen('CODE_SENT');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/outlook/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('tb_outlook_token', data.token);
        setToken(data.token);
        setScreen('READY');
        fetchClients(data.token);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const readEmailAndEstimate = useCallback(async () => {
    setScreen('ESTIMATING');
    setError('');
    setUpgradeNeeded(false);

    let emailSubject = '';
    let emailFrom = '';
    let emailBody = '';

    // Read email from Outlook
    try {
      if (typeof Office !== 'undefined' && Office.context?.mailbox?.item) {
        const item = Office.context.mailbox.item;
        emailSubject = item.subject || '';
        emailFrom = item.from?.emailAddress || '';

        emailBody = await new Promise<string>((resolve, reject) => {
          item.body.getAsync(
            Office.CoercionType.Text,
            (result: any) => {
              if (result.status === Office.AsyncResultStatus.Succeeded) {
                resolve(result.value);
              } else {
                reject(new Error('Failed to read email body'));
              }
            }
          );
        });
      } else {
        // Dev/testing fallback
        setError('No email selected. Open an email in Outlook first.');
        setScreen('READY');
        return;
      }
    } catch {
      setError('Failed to read email. Make sure an email is open.');
      setScreen('READY');
      return;
    }

    // Call estimate API
    try {
      const res = await fetch(`${API_BASE}/api/outlook/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email_subject: emailSubject,
          email_from: emailFrom,
          email_body: emailBody,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('tb_outlook_token');
        setToken('');
        setScreen('LOGIN');
        return;
      }

      if (data.upgrade) {
        setUpgradeNeeded(true);
        setError(data.error || 'Pro subscription required');
        setScreen('ERROR');
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Estimation failed');
        setScreen('ERROR');
        return;
      }

      setHours(String(data.billable_hours));
      setDescription(data.description);
      setMatter(emailSubject || '');
      setScreen('ESTIMATE_RESULT');
    } catch {
      setError('Network error. Please try again.');
      setScreen('ERROR');
    }
  }, [token]);

  async function handleCreateEntry() {
    const resolvedClient =
      clients.find((c) => c.id === selectedClientId)?.name || clientName;

    if (!resolvedClient || !matter || !hours) {
      setError('Please fill in client, matter, and hours.');
      return;
    }

    setScreen('CREATING');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/outlook/create-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          client: resolvedClient,
          client_id: selectedClientId || null,
          matter,
          time_amount: parseFloat(hours),
          description,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('tb_outlook_token');
        setToken('');
        setScreen('LOGIN');
        return;
      }

      if (data.upgrade) {
        setUpgradeNeeded(true);
        setError(data.message || data.error);
        setScreen('ERROR');
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Failed to create entry');
        setScreen('ESTIMATE_RESULT');
        return;
      }

      setCreatedEntry(data.billable);
      setScreen('SUCCESS');
    } catch {
      setError('Network error. Please try again.');
      setScreen('ESTIMATE_RESULT');
    }
  }

  function resetForm() {
    setSelectedClientId('');
    setClientName('');
    setMatter('');
    setHours('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
    setUpgradeNeeded(false);
    setCreatedEntry(null);
    setScreen('READY');
  }

  function handleLogout() {
    localStorage.removeItem('tb_outlook_token');
    setToken('');
    setEmail('');
    setScreen('LOGIN');
  }

  if (screen === 'CHECKING_AUTH') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Spinner />
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4" style={{ maxWidth: 350 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-indigo-600">TrackBillables</h1>
        {token && (
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        )}
      </div>

      {/* LOGIN */}
      {screen === 'LOGIN' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Sign in
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter your TrackBillables email to get a verification code.
          </p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSendCode}
            disabled={loading || !email.trim()}
            className="mt-3 w-full bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </div>
      )}

      {/* CODE_SENT */}
      {screen === 'CODE_SENT' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Check your email
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            maxLength={6}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="mt-3 w-full bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            onClick={() => {
              setCode('');
              setError('');
              handleSendCode();
            }}
            className="mt-2 w-full text-sm text-indigo-600 hover:text-indigo-700"
          >
            Resend code
          </button>
          <button
            onClick={() => {
              setCode('');
              setError('');
              setScreen('LOGIN');
            }}
            className="mt-1 w-full text-sm text-gray-400 hover:text-gray-600"
          >
            Use different email
          </button>
        </div>
      )}

      {/* READY */}
      {screen === 'READY' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Signed in as <strong>{email}</strong>
          </p>
          <button
            onClick={readEmailAndEstimate}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-3 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Analyze Current Email
          </button>
          <p className="mt-3 text-xs text-gray-400 text-center">
            Opens the current email and estimates billable time using AI.
          </p>
        </div>
      )}

      {/* ESTIMATING */}
      {screen === 'ESTIMATING' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner />
          <p className="mt-3 text-sm text-gray-600">Analyzing email...</p>
          <p className="mt-1 text-xs text-gray-400">
            This may take a few seconds
          </p>
        </div>
      )}

      {/* ESTIMATE_RESULT */}
      {screen === 'ESTIMATE_RESULT' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Time Estimate
          </h2>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="space-y-3">
            {/* Client */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client *
              </label>
              {clients.length > 0 ? (
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setClientName('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              {clients.length > 0 && !selectedClientId && (
                <input
                  type="text"
                  placeholder="Or type a new client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Matter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Matter *
              </label>
              <input
                type="text"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Hours */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hours *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleCreateEntry}
            className="mt-4 w-full bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Create Entry
          </button>
          <button
            onClick={resetForm}
            className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* CREATING */}
      {screen === 'CREATING' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner />
          <p className="mt-3 text-sm text-gray-600">Creating entry...</p>
        </div>
      )}

      {/* SUCCESS */}
      {screen === 'SUCCESS' && (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Entry Created
          </h2>
          {createdEntry && (
            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p>
                <strong>{createdEntry.client}</strong> &mdash;{' '}
                {createdEntry.matter}
              </p>
              <p>{createdEntry.time_amount} hours on {createdEntry.date}</p>
            </div>
          )}
          <button
            onClick={resetForm}
            className="w-full bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Analyze Another Email
          </button>
          <a
            href="https://trackbillables.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm text-indigo-600 hover:text-indigo-700"
          >
            View in Dashboard
          </a>
        </div>
      )}

      {/* ERROR */}
      {screen === 'ERROR' && (
        <div className="py-8">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm text-red-600 text-center mb-4">{error}</p>
          {upgradeNeeded && (
            <a
              href="https://trackbillables.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-purple-700 mb-3"
            >
              Upgrade to Pro
            </a>
          )}
          <button
            onClick={resetForm}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  );
}
