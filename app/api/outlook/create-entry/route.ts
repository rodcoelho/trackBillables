// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken, extractTokenFromRequest } from '@/lib/outlook/auth';
import { corsHeaders, handleCorsPreflight } from '@/lib/outlook/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers }
      );
    }

    const { date, client, client_id, matter, time_amount, description } =
      await request.json();

    // Validate required fields
    if (!date || !client || !matter || time_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields (date, client, matter, time_amount)' },
        { status: 400, headers }
      );
    }

    const parsedTime = parseFloat(time_amount);
    if (parsedTime <= 0 || parsedTime > 24) {
      return NextResponse.json(
        { error: 'Time amount must be between 0.1 and 24 hours' },
        { status: 400, headers }
      );
    }

    const adminClient = createAdminClient();

    // Check subscription and entry limits
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404, headers }
      );
    }

    // Free tier: 50 entries/month limit
    if (subscription.tier === 'free') {
      const resetDate = new Date(subscription.usage_reset_date);
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (resetDate < firstOfMonth) {
        await adminClient
          .from('subscriptions')
          .update({
            entries_count_current_month: 0,
            exports_count_current_month: 0,
            usage_reset_date: firstOfMonth.toISOString().split('T')[0],
          })
          .eq('user_id', payload.userId);

        subscription.entries_count_current_month = 0;
      }

      if (subscription.entries_count_current_month >= 50) {
        return NextResponse.json(
          {
            error: 'Entry limit reached',
            upgrade: true,
            message:
              "You've reached your free plan limit of 50 entries per month. Upgrade to Pro for unlimited entries!",
          },
          { status: 403, headers }
        );
      }
    }

    // Insert billable
    const { data: billable, error: insertError } = await adminClient
      .from('billables')
      .insert({
        user_id: payload.userId,
        date,
        client,
        client_id: client_id || null,
        matter,
        time_amount: parsedTime,
        description: description || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert billable:', insertError);
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500, headers }
      );
    }

    // Increment entry count for free tier
    if (subscription.tier === 'free') {
      await adminClient
        .from('subscriptions')
        .update({
          entries_count_current_month:
            subscription.entries_count_current_month + 1,
        })
        .eq('user_id', payload.userId);
    }

    return NextResponse.json(
      { success: true, billable },
      { status: 201, headers }
    );
  } catch (error) {
    console.error('Outlook create entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
