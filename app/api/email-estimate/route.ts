// @ts-nocheck - TODO: Fix Supabase client type definitions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check if user is Pro
    if (subscription.tier !== 'pro' || !['active', 'trialing'].includes(subscription.status)) {
      return NextResponse.json(
        {
          error: 'This feature is only available for Pro users.',
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const { attorney_email, email_chain } = await request.json();

    if (!attorney_email || !email_chain) {
      return NextResponse.json(
        { error: 'Attorney email and email chain are required' },
        { status: 400 }
      );
    }

    // Construct the prompt for Claude
    const prompt = `You are an experienced attorney specializing in billing practices for legal work, particularly email correspondence involving document review and responses. Your task is to analyze the provided email chain and estimate the billable time for handling it, assuming a standard hourly billing model with 0.1-hour (6-minute) increments and a minimum of 0.1 hours per interaction.

Consider time spent on:
- Reading and reviewing incoming emails and any attached documents (estimate based on length and complexity: e.g., short email = 2-5 minutes, detailed with docs = 10-20 minutes).
- Analyzing legal implications, researching if implied, and strategizing responses.
- Drafting and sending outgoing responses (e.g., quick reply = 3-5 minutes, substantive = 10-15 minutes).
- Any back-and-forth exchanges in the chain, counting only the attorney's side (reviewing received messages and preparing responses).

Do not include non-billable time like administrative tasks. Round up to the nearest 0.1 hour per task and sum for the total chain.

The attorney's email address is: ${attorney_email}

Only count time for emails FROM this attorney. Do not count time for emails TO this attorney (those are client emails).

Email chain:
${email_chain}

Output exactly in this JSON format with no additional text, explanations, markdown, or preamble:

{
  "billable_hours": 0.8,
  "description": "Reviewed initial email and attached documents (0.3 hours); drafted and sent first response (0.2 hours); reviewed second incoming message and prepared reply (0.3 hours)."
}`;

    // Call Claude API with Haiku model
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again or enter manually.' },
        { status: 500 }
      );
    }

    // Validate response structure
    if (
      typeof parsedResponse.billable_hours !== 'number' ||
      typeof parsedResponse.description !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid response format from AI. Please try again or enter manually.' },
        { status: 500 }
      );
    }

    // Save attorney_email to database if it's different
    if (attorney_email !== subscription.attorney_email) {
      const adminClient = createAdminClient();
      await adminClient
        .from('subscriptions')
        .update({ attorney_email })
        .eq('user_id', user.id);
    }

    // Return the estimate
    return NextResponse.json({
      billable_hours: parsedResponse.billable_hours,
      description: parsedResponse.description,
    });
  } catch (error) {
    console.error('Email estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate estimate. Please try again or enter manually.' },
      { status: 500 }
    );
  }
}
