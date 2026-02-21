// @ts-nocheck - TODO: Fix Supabase client type definitions
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
    const { tier, notes } = body;

    // Validate tier
    if (!tier || !['free', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "free" or "pro"' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch current subscription to store old value
    const { data: oldSubscription } = await adminClient
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single() as { data: { tier: string } | null };

    // Update tier
    const { data: subscription, error: updateError } = await (adminClient
      .from('subscriptions') as any)
      .update({
        tier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('tier, updated_at')
      .single();

    if (updateError) {
      console.error('Error changing tier:', updateError);
      return NextResponse.json(
        { error: 'Failed to change tier' },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      adminUserId: auth.user.id,
      action: 'change_tier',
      targetUserId: userId,
      details: {
        old_tier: oldSubscription?.tier || 'unknown',
        new_tier: tier,
        user_email: user.email,
      },
      notes: notes || undefined,
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({
      success: true,
      message: `Tier changed to ${tier}`,
      subscription: {
        tier: subscription.tier,
        updated_at: subscription.updated_at,
      },
    });
  } catch (error) {
    console.error('Error changing tier:', error);
    return NextResponse.json(
      { error: 'Failed to change tier' },
      { status: 500 }
    );
  }
}
