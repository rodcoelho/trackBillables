'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SubscriptionBadge from '@/components/admin/SubscriptionBadge';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface UserDetail {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string;
    auth_provider: string;
    is_admin: boolean;
  };
  subscription: {
    id: string;
    tier: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    billing_interval: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    trial_start: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
    entries_count_current_month: number;
    exports_count_current_month: number;
    usage_reset_date: string;
    updated_at: string;
  };
  recentBillables: Array<{
    id: string;
    date: string;
    client: string;
    matter: string;
    time_amount: number;
    created_at: string;
  }>;
  billablesTotalCount: number;
  auditLog: Array<{
    id: string;
    admin_email: string;
    action: string;
    notes: string | null;
    details: any;
    created_at: string;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showResetUsageModal, setShowResetUsageModal] = useState(false);
  const [showChangeTierModal, setShowChangeTierModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  // Form states
  const [newTier, setNewTier] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Billables expansion
  const [showAllBillables, setShowAllBillables] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user details');
      }
      const result = await response.json();
      setData(result);
      setNewTier(result.subscription.tier);
      setNewStatus(result.subscription.status);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      setError(error.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsage = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || undefined }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset usage');
      }

      alert('Usage counters reset successfully!');
      setShowResetUsageModal(false);
      setNotes('');
      fetchUserDetail(); // Refresh data
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Failed to reset usage counters');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeTier = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/change-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier, notes: notes || undefined }),
      });

      if (!response.ok) {
        throw new Error('Failed to change tier');
      }

      alert(`Tier changed to ${newTier} successfully!`);
      setShowChangeTierModal(false);
      setNotes('');
      fetchUserDetail(); // Refresh data
    } catch (error) {
      console.error('Error changing tier:', error);
      alert('Failed to change tier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      });

      if (!response.ok) {
        throw new Error('Failed to change status');
      }

      alert(`Status changed to ${newStatus} successfully!`);
      setShowChangeStatusModal(false);
      setNotes('');
      fetchUserDetail(); // Refresh data
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="mb-4">
          <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Users
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-900 text-sm mb-2 inline-block">
          ← Back to Users
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{data.user.email}</h1>
          {data.user.is_admin && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  clipRule="evenodd"
                />
              </svg>
              Admin User
            </span>
          )}
        </div>
        <p className="text-gray-600 mt-1">User Details & Management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Subscription */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{data.user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{data.user.email}</span>
                    {data.user.is_admin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        Admin
                      </span>
                    )}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Auth Provider</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{data.user.auth_provider}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(data.user.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.user.last_sign_in_at
                    ? new Date(data.user.last_sign_in_at).toLocaleString()
                    : 'Never'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tier</dt>
                <dd className="mt-1">
                  <SubscriptionBadge tier={data.subscription.tier} type="tier" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <SubscriptionBadge status={data.subscription.status} type="status" />
                </dd>
              </div>
              {data.subscription.stripe_customer_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stripe Customer</dt>
                  <dd className="mt-1">
                    <a
                      href={`https://dashboard.stripe.com/customers/${data.subscription.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-900 font-mono"
                    >
                      {data.subscription.stripe_customer_id} ↗
                    </a>
                  </dd>
                </div>
              )}
              {data.subscription.stripe_subscription_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stripe Subscription</dt>
                  <dd className="mt-1">
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${data.subscription.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-900 font-mono"
                    >
                      {data.subscription.stripe_subscription_id} ↗
                    </a>
                  </dd>
                </div>
              )}
              {data.subscription.billing_interval && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Billing Interval</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {data.subscription.billing_interval}ly
                  </dd>
                </div>
              )}
              {data.subscription.current_period_start && data.subscription.current_period_end && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(data.subscription.current_period_start).toLocaleDateString()} -{' '}
                    {new Date(data.subscription.current_period_end).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Cancel at Period End</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.subscription.cancel_at_period_end ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Usage Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Stats (Current Month)</h2>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Entries Used</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  {data.subscription.entries_count_current_month}
                  {data.subscription.tier === 'free' && (
                    <span className="text-sm font-normal text-gray-500"> / 50</span>
                  )}
                  {data.subscription.tier === 'pro' && (
                    <span className="text-sm font-normal text-gray-500"> / Unlimited</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Exports Used</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  {data.subscription.exports_count_current_month}
                  {data.subscription.tier === 'free' && (
                    <span className="text-sm font-normal text-gray-500"> / 1</span>
                  )}
                  {data.subscription.tier === 'pro' && (
                    <span className="text-sm font-normal text-gray-500"> / Unlimited</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Billables</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">{data.billablesTotalCount}</dd>
              </div>
              <div className="md:col-span-3">
                <dt className="text-sm font-medium text-gray-500">Usage Reset Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(data.subscription.usage_reset_date).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Recent Billables */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Billables {!showAllBillables && `(Last 10)`}
              </h2>
              {data.billablesTotalCount > 10 && (
                <button
                  onClick={() => setShowAllBillables(!showAllBillables)}
                  className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                >
                  {showAllBillables ? 'Show Less' : `View All (${data.billablesTotalCount})`}
                </button>
              )}
            </div>

            {data.recentBillables.length === 0 ? (
              <p className="text-gray-500 text-sm">No billables yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Matter</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.recentBillables.map((billable) => (
                      <tr key={billable.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{new Date(billable.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{billable.client}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{billable.matter}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{billable.time_amount}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(billable.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Log for This User */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Actions (Last 10)</h2>
              <Link
                href={`/admin/audit-log?target_user_id=${userId}`}
                className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
              >
                View All
              </Link>
            </div>

            {data.auditLog.length === 0 ? (
              <p className="text-gray-500 text-sm">No admin actions yet</p>
            ) : (
              <div className="space-y-3">
                {data.auditLog.map((log) => (
                  <div key={log.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.action.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-xs text-gray-500 mt-1">by {log.admin_email}</p>
                        {log.notes && <p className="text-sm text-gray-700 mt-1">{log.notes}</p>}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Admin Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowResetUsageModal(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Reset Usage Counters
              </button>

              <button
                onClick={() => setShowChangeTierModal(true)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Change Tier
              </button>

              <button
                onClick={() => setShowChangeStatusModal(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Change Status
              </button>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Stripe Dashboard</p>
                {data.subscription.stripe_customer_id ? (
                  <>
                    <a
                      href={`https://dashboard.stripe.com/customers/${data.subscription.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium text-center mb-2"
                    >
                      View Customer ↗
                    </a>
                    {data.subscription.stripe_subscription_id && (
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${data.subscription.stripe_subscription_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium text-center"
                      >
                        View Subscription ↗
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 italic">No Stripe customer</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showResetUsageModal && (
        <ConfirmModal
          isOpen={showResetUsageModal}
          onClose={() => {
            setShowResetUsageModal(false);
            setNotes('');
          }}
          onConfirm={handleResetUsage}
          title="Reset Usage Counters"
          message="This will reset both entries and exports counters to 0 for the current month. The user will be able to add more entries and exports."
          confirmText="Reset"
          type="warning"
          isLoading={actionLoading}
        />
      )}

      {showChangeTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowChangeTierModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Tier</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reason for change..."
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ This does NOT modify Stripe subscription. Handle that separately in Stripe dashboard.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangeTierModal(false);
                    setNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeTier}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Changing...' : 'Change Tier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangeStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowChangeStatusModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reason for change..."
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ This may affect user access immediately.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangeStatusModal(false);
                    setNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeStatus}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Changing...' : 'Change Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
