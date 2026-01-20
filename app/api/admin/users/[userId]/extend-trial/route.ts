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

    // Parse request body
    const body = await request.json();
    const { trial_end, notes } = body;

    // Validate trial_end
    if (!trial_end) {
      return NextResponse.json(
        { error: 'trial_end is required (ISO 8601 timestamp)' },
        { status: 400 }
      );
    }

    // Parse and validate trial_end date
    const trialEndDate = new Date(trial_end);
    if (isNaN(trialEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid trial_end format. Must be ISO 8601 timestamp' },
        { status: 400 }
      );
    }

    // Check that trial_end is in the future
    if (trialEndDate <= new Date()) {
      return NextResponse.json(
        { error: 'trial_end must be in the future' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await adminClient
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single() as { data: { email: string } | null, error: any };

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch current subscription
    const { data: oldSubscription } = await adminClient
      .from('subscriptions')
      .select('status, trial_end')
      .eq('user_id', userId)
      .single() as { data: { status: string, trial_end: string | null } | null };

    // Check if user is currently trialing
    if (oldSubscription?.status !== 'trialing') {
      return NextResponse.json(
        {
          error: `Cannot extend trial. User status is "${oldSubscription?.status}". Must be "trialing"`,
        },
        { status: 400 }
      );
    }

    // Update trial_end
    const { data: subscription, error: updateError } = await (adminClient
      .from('subscriptions') as any)
      .update({
        trial_end: trialEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('trial_end, updated_at')
      .single();

    if (updateError) {
      console.error('Error extending trial:', updateError);
      return NextResponse.json(
        { error: 'Failed to extend trial' },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      adminUserId: auth.user.id,
      action: 'extend_trial',
      targetUserId: userId,
      details: {
        old_trial_end: oldSubscription?.trial_end || null,
        new_trial_end: trialEndDate.toISOString(),
        user_email: user.email,
      },
      notes: notes || undefined,
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({
      success: true,
      message: `Trial extended to ${trialEndDate.toISOString().split('T')[0]}`,
      subscription: {
        trial_end: subscription.trial_end,
        updated_at: subscription.updated_at,
      },
    });
  } catch (error) {
    console.error('Error extending trial:', error);
    return NextResponse.json(
      { error: 'Failed to extend trial' },
      { status: 500 }
    );
  }
}
