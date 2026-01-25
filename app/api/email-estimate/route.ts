// @ts-nocheck - TODO: Fix Supabase client type definitions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

// Force Node.js runtime (required for Anthropic SDK)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('Email estimate API called');

  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'Email estimate feature is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client inside the function
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Verify authentication
    console.log('Checking authentication...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Get user's subscription
    console.log('Fetching subscription...');
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription error:', subError);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    console.log('Subscription tier:', subscription.tier, 'Status:', subscription.status);

    // Check if user is Pro
    if (subscription.tier !== 'pro' || !['active', 'trialing'].includes(subscription.status)) {
      console.log('User is not Pro, rejecting request');
      return NextResponse.json(
        {
          error: 'This feature is only available for Pro users.',
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // Parse request body
    console.log('Parsing request body...');
    const { attorney_email, email_chain } = await request.json();

    if (!attorney_email || !email_chain) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Attorney email and email chain are required' },
        { status: 400 }
      );
    }

    console.log('Attorney email:', attorney_email);
    console.log('Email chain length:', email_chain.length);

    // Construct the prompt for Claude
    const prompt = `You are an experienced attorney specializing in billing practices for legal work. Your task is to analyze an email chain and estimate billable time based on the attorney's actual work.

CRITICAL INSTRUCTIONS:
1. First, verify this is legal correspondence. If the emails are personal, customer service, shopping, or non-legal matters, return 0.0 hours with an appropriate description.
2. Count ONLY emails FROM the attorney's email address: ${attorney_email}
3. For EACH attorney email, analyze the actual content, length, and complexity
4. Do NOT use generic estimates - examine what was actually written

ANALYSIS STEPS:
1. Identify all emails FROM ${attorney_email}
2. For each attorney email, estimate time based on:
   - Length: Quick reply (1-2 sentences) = 0.1 hours, Medium (1-2 paragraphs) = 0.2 hours, Long/detailed = 0.3+ hours
   - Complexity: Simple acknowledgment = 0.1 hours, Legal analysis/advice = 0.3-0.5 hours, Complex research/strategy = 0.5+ hours
   - Reading incoming messages before responding: Brief = add 0.1 hours, Detailed with attachments = add 0.2-0.3 hours

3. Sum the total time for all attorney emails

BILLING RULES:
- Use 0.1-hour (6-minute) increments
- Minimum 0.1 hours per email response
- Do not bill for emails TO the attorney (client emails)
- Do not include administrative tasks

Email chain to analyze:
${email_chain}

IMPORTANT: Your description must reference the actual content and dates from the emails above. Do NOT use generic placeholder text. Describe what the attorney actually did (e.g., "Reviewed client's contract question email (0.1 hours); drafted response with initial legal analysis of indemnification clause (0.3 hours)").

You must output ONLY valid JSON with no additional text, explanations, preamble, or markdown code blocks. Start your response directly with the opening brace {

Required output format:
{
  "billable_hours": [calculated total],
  "description": "[Specific description of actual work performed with times]"
}`;

    // Call Claude API with Haiku model
    console.log('Calling Claude API...');
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('Claude API response received');

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('Response text:', responseText);

    // Strip markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      // Remove ```json or ``` from start
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '');
      // Remove ``` from end
      cleanedText = cleanedText.replace(/\n?```$/, '');
      cleanedText = cleanedText.trim();
    }

    // Extract JSON if there's explanatory text before it
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
      console.log('Parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', cleanedText);
      console.error('Parse error:', parseError);
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
      console.error('Invalid response structure:', parsedResponse);
      return NextResponse.json(
        { error: 'Invalid response format from AI. Please try again or enter manually.' },
        { status: 500 }
      );
    }

    // Save attorney_email to database if it's different
    if (attorney_email !== subscription.attorney_email) {
      console.log('Saving attorney email to database...');
      const adminClient = createAdminClient();
      await adminClient
        .from('subscriptions')
        .update({ attorney_email })
        .eq('user_id', user.id);
    }

    console.log('Returning estimate:', parsedResponse.billable_hours, 'hours');

    // Return the estimate
    return NextResponse.json({
      billable_hours: parsedResponse.billable_hours,
      description: parsedResponse.description,
    });
  } catch (error) {
    console.error('Email estimate error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to generate estimate. Please try again or enter manually.' },
      { status: 500 }
    );
  }
}
