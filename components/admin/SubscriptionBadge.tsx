interface SubscriptionBadgeProps {
  tier?: string;
  status?: string;
  type: 'tier' | 'status';
}

export default function SubscriptionBadge({
  tier,
  status,
  type,
}: SubscriptionBadgeProps) {
  const value = type === 'tier' ? tier : status;

  // Tier badge colors
  const tierColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-800 border-gray-200',
    pro: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };

  // Status badge colors
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    trialing: 'bg-blue-100 text-blue-800 border-blue-200',
    past_due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    canceled: 'bg-red-100 text-red-800 border-red-200',
    incomplete: 'bg-orange-100 text-orange-800 border-orange-200',
    incomplete_expired: 'bg-gray-100 text-gray-800 border-gray-200',
    unpaid: 'bg-red-100 text-red-800 border-red-200',
  };

  const colors = type === 'tier' ? tierColors : statusColors;
  const colorClass = value ? colors[value] || colors.free : colors.free;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {value || 'unknown'}
    </span>
  );
}
