// @ts-nocheck - TODO: Fix Supabase client type definitions
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, client, matter, time_amount, description, case_number, client_id } = body;

    // Validate required fields
    if (!date || !client || !matter || time_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate time_amount
    if (time_amount <= 0 || time_amount > 24) {
      return NextResponse.json(
        { error: 'Time amount must be between 0.1 and 24 hours' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check subscription and entry limits
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if user can add entry (free tier: 50 entries/month)
    if (subscription.tier === 'free') {
      // Check if we need to reset the counter (new month)
      const resetDate = new Date(subscription.usage_reset_date);
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (resetDate < firstOfMonth) {
        // Reset counters
        await supabase
          .from('subscriptions')
          .update({
            entries_count_current_month: 0,
            exports_count_current_month: 0,
            usage_reset_date: firstOfMonth.toISOString().split('T')[0],
          })
          .eq('user_id', user.id);

        // Refresh subscription data
        const { data: refreshedSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (refreshedSub) {
          Object.assign(subscription, refreshedSub);
        }
      }

      // Check limit
      if (subscription.entries_count_current_month >= 50) {
        return NextResponse.json(
          {
            error: 'Entry limit reached',
            upgrade: true,
            message: "You've reached your free plan limit of 50 entries per month. Upgrade to Pro for unlimited entries!"
          },
          { status: 403 }
        );
      }
    }

    // Pro users have unlimited entries (skip limit check)

    // Insert the billable
    const { data: billable, error: insertError } = await supabase
      .from('billables')
      .insert({
        user_id: user.id,
        date,
        client,
        client_id: client_id || null,
        matter,
        time_amount: parseFloat(time_amount),
        description: description || null,
        case_number: case_number || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert billable:', insertError);
      return NextResponse.json(
        { error: 'Failed to add billable entry' },
        { status: 500 }
      );
    }

    // Increment entry count for free tier users
    if (subscription.tier === 'free') {
      await supabase
        .from('subscriptions')
        .update({
          entries_count_current_month: subscription.entries_count_current_month + 1,
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, billable }, { status: 201 });
  } catch (error) {
    console.error('Add billable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
