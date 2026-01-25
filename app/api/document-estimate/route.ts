// @ts-nocheck - TODO: Fix Supabase client type definitions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Force Node.js runtime (required for Anthropic SDK)
export const runtime = 'nodejs';

// Helper function to get file type from extension
function getMediaType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const typeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'rtf': 'application/rtf',
  };
  return typeMap[ext] || 'application/octet-stream';
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function POST(request: Request) {
  console.log('Document estimate API called');

  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'Document estimate feature is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client
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

    // Parse form data
    console.log('Parsing form data...');
    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];

    if (!files || files.length === 0) {
      console.error('No files provided');
      return NextResponse.json(
        { error: 'At least one document is required' },
        { status: 400 }
      );
    }

    if (files.length > 15) {
      console.error('Too many files:', files.length);
      return NextResponse.json(
        { error: 'Maximum 15 documents allowed' },
        { status: 400 }
      );
    }

    console.log('Processing', files.length, 'documents');

    // Build document summaries for the prompt
    const documentSummaries = await Promise.all(
      files.map(async (file, index) => {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        return `Document ${index + 1}: "${file.name}" (${sizeInMB} MB, type: ${file.type || 'unknown'})`;
      })
    );

    // Convert files to base64 for Claude API
    const documentContents = await Promise.all(
      files.map(async (file) => {
        const base64 = await fileToBase64(file);
        const mediaType = getMediaType(file.name);

        return {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType,
            data: base64,
          },
        };
      })
    );

    // Construct the prompt for Claude
    const prompt = `You are an experienced attorney specializing in billing practices for legal work, particularly document review and analysis. Your task is to analyze the provided set of up to 15 documents (such as PDFs, text files, or other formats) and estimate the billable time for handling them, assuming a standard hourly billing model with 0.1-hour (6-minute) increments and a minimum of 0.1 hours per document or major task.

Consider time spent on:
- Reading and reviewing each document (estimate based on length and complexity: e.g., short text file = 2-5 minutes, detailed PDF with multiple pages = 10-20 minutes per document or section).
- Analyzing legal implications, researching if implied, and strategizing any necessary actions or responses.
- Any interconnected analysis across documents, such as cross-referencing or synthesizing information.

Do not assume drafting responses unless explicitly indicated in the documents; focus on review and analysis.

Do not include non-billable time like administrative tasks. Round up to the nearest 0.1 hour per task and sum for the total.

Input: ${documentSummaries.join('; ')}

Output exactly in this JSON format with no additional text, explanations, markdown, or preamble:

{
  "billable_hours": 1.2,
  "description": "Reviewed Document 1 (short PDF, 5 pages) and analyzed implications (0.2 hours); reviewed Document 2 (detailed text file) with cross-references (0.3 hours); continued with Documents 3-5, synthesizing legal aspects (0.7 hours)."
}`;

    // Call Claude API with document support
    console.log('Calling Claude API with', files.length, 'documents...');
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            ...documentContents,
          ],
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
    console.error('Document estimate error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));

    // Check for specific Anthropic API errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 100 page limit error
    if (errorMessage.includes('maximum of 100 PDF pages')) {
      return NextResponse.json(
        { error: 'Total PDF pages exceed 100-page limit. Please upload fewer or smaller documents.' },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to generate estimate. Please try again or enter manually.' },
      { status: 500 }
    );
  }
}
