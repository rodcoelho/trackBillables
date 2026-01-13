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
    const { status, notes } = body;

    // Validate status
    const validStatuses = [
      'active',
      'trialing',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'unpaid',
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
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

    // Fetch current subscription to store old value
    const { data: oldSubscription } = await adminClient
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    // Update status
    const { data: subscription, error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('status, updated_at')
      .single();

    if (updateError) {
      console.error('Error changing status:', updateError);
      return NextResponse.json(
        { error: 'Failed to change status' },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      adminUserId: auth.user.id,
      action: 'change_status',
      targetUserId: userId,
      details: {
        old_status: oldSubscription?.status || 'unknown',
        new_status: status,
        user_email: user.email,
      },
      notes: notes || undefined,
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({
      success: true,
      message: `Status changed to ${status}`,
      subscription: {
        status: subscription.status,
        updated_at: subscription.updated_at,
      },
    });
  } catch (error) {
    console.error('Error changing status:', error);
    return NextResponse.json(
      { error: 'Failed to change status' },
      { status: 500 }
    );
  }
}
