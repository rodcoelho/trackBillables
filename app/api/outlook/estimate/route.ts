// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken, extractTokenFromRequest } from '@/lib/outlook/auth';
import { corsHeaders, handleCorsPreflight } from '@/lib/outlook/cors';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  try {
    // Auth
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

    // Pro tier check
    const adminClient = createAdminClient();
    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404, headers }
      );
    }

    if (
      subscription.tier !== 'pro' ||
      !['active', 'trialing'].includes(subscription.status)
    ) {
      return NextResponse.json(
        { error: 'This feature requires a Pro subscription.', upgrade: true },
        { status: 403, headers }
      );
    }

    // Parse input
    const { email_subject, email_from, email_body } = await request.json();

    if (!email_body) {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400, headers }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI estimation is not configured.' },
        { status: 500, headers }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const emailContent = `Subject: ${email_subject || '(no subject)'}
From: ${email_from || '(unknown)'}

${email_body}`;

    const prompt = `You are an experienced attorney analyzing an email to estimate billable time based on actual work that would be performed.

CRITICAL INSTRUCTIONS:
1. Analyze the email content, length, and complexity
2. Estimate time based on:
   - Reading the email: Brief = 0.1 hours, Medium = 0.1-0.2 hours, Long/detailed = 0.2-0.3 hours
   - Drafting a response: Quick reply = 0.1 hours, Medium = 0.2-0.3 hours, Detailed = 0.3-0.5 hours
   - Research/analysis if needed: 0.1-0.5 hours depending on complexity

BILLING RULES:
- Use 0.1-hour (6-minute) increments
- Minimum 0.1 hours
- Consider reading + response + any research time

Email to analyze:
${emailContent}

IMPORTANT: Your description must reference the actual content from the email above. Describe what billable work would be involved (e.g., "Review client email re: contract terms (0.1 hours); draft response addressing key provisions (0.2 hours)").

You must output ONLY valid JSON with no additional text. Start your response directly with the opening brace {

Required output format:
{
  "billable_hours": [calculated total],
  "description": "[Specific description of billable work with time breakdown]"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Clean and parse response
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '');
      cleanedText = cleanedText.replace(/\n?```$/, '');
      cleanedText = cleanedText.trim();
    }

    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500, headers }
      );
    }

    if (
      typeof parsedResponse.billable_hours !== 'number' ||
      typeof parsedResponse.description !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid AI response format. Please try again.' },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        billable_hours: parsedResponse.billable_hours,
        description: parsedResponse.description,
      },
      { headers }
    );
  } catch (error) {
    console.error('Outlook estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate estimate. Please try again.' },
      { status: 500, headers }
    );
  }
}
