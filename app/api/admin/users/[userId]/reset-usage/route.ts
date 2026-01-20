// @ts-nocheck - TODO: Fix Supabase admin client type definitions
import { NextResponse } from 'next/server';
import { verifyAdmin, createAuditLog, getIpAddress } from '@/lib/admin/helpers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
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

    // Parse request body for optional notes
    let notes: string | undefined;
    try {
      const body = await request.json();
      notes = body.notes;
    } catch {
      // Body is optional, ignore parse errors
    }

    // Verify user exists
    const { data: user, error: userError } = await adminClient
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch current subscription to store old values
    const { data: oldSubscription } = await adminClient
      .from('subscriptions')
      .select('entries_count_current_month, exports_count_current_month')
      .eq('user_id', userId)
      .single();

    // Reset usage counters
    const updateData = {
      entries_count_current_month: 0,
      exports_count_current_month: 0,
      usage_reset_date: new Date().toISOString().split('T')[0], // Current date
      updated_at: new Date().toISOString(),
    };

    const { data: subscription, error: updateError } = await adminClient
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select('entries_count_current_month, exports_count_current_month, usage_reset_date')
      .single();

    if (updateError) {
      console.error('Error resetting usage:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset usage counters' },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      adminUserId: auth.user.id,
      action: 'reset_usage',
      targetUserId: userId,
      details: {
        old_values: {
          entries_count: oldSubscription?.entries_count_current_month || 0,
          exports_count: oldSubscription?.exports_count_current_month || 0,
        },
        new_values: {
          entries_count: 0,
          exports_count: 0,
        },
        user_email: user.email,
      },
      notes: notes || undefined,
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({
      success: true,
      message: 'Usage counters reset successfully',
      subscription: {
        entries_count_current_month: subscription.entries_count_current_month,
        exports_count_current_month: subscription.exports_count_current_month,
        usage_reset_date: subscription.usage_reset_date,
      },
    });
  } catch (error) {
    console.error('Error resetting usage:', error);
    return NextResponse.json(
      { error: 'Failed to reset usage counters' },
      { status: 500 }
    );
  }
}
