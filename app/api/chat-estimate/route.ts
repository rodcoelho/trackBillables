// @ts-nocheck - TODO: Fix Supabase client type definitions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Force Node.js runtime (required for Anthropic SDK)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('Chat estimate API called');

  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'Chat estimate feature is not configured. Please contact support.' },
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
    const { chat_history } = await request.json();

    if (!chat_history) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Chat history is required' },
        { status: 400 }
      );
    }

    console.log('Chat history length:', chat_history.length);

    // Construct the prompt for Claude
    const prompt = `You are an experienced professional analyzing an LLM chat history to estimate billable time spent on the interaction.

CRITICAL INSTRUCTIONS:
1. Analyze the full chat conversation between the user and the LLM
2. Estimate time for EACH user message and EACH LLM response
3. Base estimates on actual content, length, and complexity

ANALYSIS STEPS:
1. For each USER message, estimate time spent composing it:
   - Quick question (1-2 sentences) = 0.1 hours
   - Detailed prompt with context (1-2 paragraphs) = 0.2 hours
   - Complex prompt with specifications/requirements = 0.3-0.5 hours
   - Iterative refinement or follow-up = 0.1-0.2 hours

2. For each LLM RESPONSE, estimate time spent reading and analyzing:
   - Short response (1-2 paragraphs) = 0.1 hours
   - Medium response with code or detailed explanation = 0.2 hours
   - Long/complex response requiring careful review = 0.3-0.5 hours

3. Additional thinking/analysis time:
   - Testing or implementing suggestions from the LLM = 0.1-0.3 hours per instance
   - Cross-referencing or verifying LLM output = 0.1-0.2 hours

4. Sum the total time for the entire chat session

BILLING RULES:
- Use 0.1-hour (6-minute) increments
- Minimum 0.1 hours for the entire session
- Account for context-switching and re-reading time in long conversations

Chat history to analyze:
${chat_history}

IMPORTANT: Your description must be a 1-2 sentence summary of the chat topic and what was accomplished. Reference actual content from the conversation. Do NOT use generic placeholder text.

You must output ONLY valid JSON with no additional text, explanations, preamble, or markdown code blocks. Start your response directly with the opening brace {

Required output format:
{
  "billable_hours": [calculated total],
  "description": "[1-2 sentence summary of the chat topic and work performed]"
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

    console.log('Returning estimate:', parsedResponse.billable_hours, 'hours');

    // Return the estimate
    return NextResponse.json({
      billable_hours: parsedResponse.billable_hours,
      description: parsedResponse.description,
    });
  } catch (error) {
    console.error('Chat estimate error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to generate estimate. Please try again or enter manually.' },
      { status: 500 }
    );
  }
}
