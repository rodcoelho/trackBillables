// @ts-nocheck - TODO: Fix Supabase admin client type definitions
import { NextResponse } from 'next/server';
import { verifyAdmin, getUserEmailsByIds } from '@/lib/admin/helpers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // Verify admin authentication
  const auth = await verifyAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response;
  }

  try {
    const adminClient = createAdminClient();
    const { userId } = params;

    // Fetch user details using Auth Admin API
    const { data: authData, error: userError } = await adminClient.auth.admin.getUserById(userId);

    if (userError || !authData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = authData.user;

    // Determine auth provider from metadata
    const authProvider = user.app_metadata?.provider || 'email';

    // Fetch subscription details
    const { data: subscription, error: subscriptionError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription details' },
        { status: 500 }
      );
    }

    // Fetch recent billables (last 10)
    const { data: recentBillables, error: billablesError } = await adminClient
      .from('billables')
      .select('id, date, client, matter, time_amount, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    if (billablesError) {
      console.error('Error fetching billables:', billablesError);
    }

    // Fetch total billables count
    const { count: billablesTotalCount } = await adminClient
      .from('billables')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Fetch audit log for this user (last 10 actions)
    const { data: auditLogs } = await adminClient
      .from('admin_audit_log')
      .select('id, admin_user_id, action, notes, details, created_at')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch admin emails for audit logs
    const adminUserIds = auditLogs?.map((log) => log.admin_user_id) || [];
    const adminEmailMap = await getUserEmailsByIds(adminUserIds);

    // Build audit log response with admin emails
    const auditLog = auditLogs?.map((log) => ({
      id: log.id,
      admin_email: adminEmailMap.get(log.admin_user_id) || 'Unknown',
      action: log.action,
      notes: log.notes,
      details: log.details,
      created_at: log.created_at,
    })) || [];

    // Check if user is an admin
    const { data: isAdminUser } = await adminClient
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    // Build response
    const response = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        auth_provider: authProvider,
        is_admin: !!isAdminUser,
      },
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        stripe_customer_id: subscription.stripe_customer_id,
        stripe_subscription_id: subscription.stripe_subscription_id,
        billing_interval: subscription.billing_interval,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        entries_count_current_month: subscription.entries_count_current_month,
        exports_count_current_month: subscription.exports_count_current_month,
        usage_reset_date: subscription.usage_reset_date,
        updated_at: subscription.updated_at,
      },
      recentBillables: recentBillables || [],
      billablesTotalCount: billablesTotalCount || 0,
      auditLog,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
