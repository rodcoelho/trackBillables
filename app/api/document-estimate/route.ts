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

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

    // Determine if this is simple or in-depth mode
    const contentType = request.headers.get('content-type') || '';
    const isSimpleMode = contentType.includes('application/json');

    if (isSimpleMode) {
      // SIMPLE MODE: Metadata-based estimation
      console.log('Processing in SIMPLE mode');
      const body = await request.json();
      const { files } = body;

      if (!files || files.length === 0) {
        console.error('No file metadata provided');
        return NextResponse.json(
          { error: 'At least one document is required' },
          { status: 400 }
        );
      }

      console.log('Processing', files.length, 'documents in simple mode');

      // Build prompt for simple mode
      const fileDescriptions = files.map((file: any, index: number) => {
        const parts = [
          `Document ${index + 1}: "${file.name}"`,
          `${formatFileSize(file.size)}`,
        ];
        if (file.pageCount) {
          parts.push(`${file.pageCount} pages`);
        }
        parts.push(`Effort Level: ${file.level.toUpperCase()}`);
        if (file.category) {
          parts.push(`Type: ${file.category}`);
        }
        return parts.join(', ');
      }).join('\n');

      const prompt = `You are an experienced attorney specializing in billing practices for legal work, particularly document review and analysis. Your task is to estimate billable time based on document metadata and categorization.

You are provided with a list of documents with file names, sizes, page counts (when available), effort levels, and optional document type categories.

Estimate billable hours using these baseline guidelines:

LOW EFFORT:
- Base time: 0.1 hours (6 minutes)
- Use for quick reviews, brief correspondence, simple forms
- Adjust upward based on page count and file size (e.g., 10+ pages might warrant 0.2 hours)

MEDIUM EFFORT:
- Base time range: 0.1-0.3 hours (6-18 minutes)
- Use for contracts, email chains, financial statements, discovery responses
- Scale within range based on page count and complexity (e.g., 5 pages = 0.1 hours, 30 pages = 0.3 hours, 50+ pages = up to 0.5 hours)

HIGH EFFORT:
- Base time: 0.3+ hours (18+ minutes)
- Use for legal briefs, depositions, technical reports, regulatory filings, memos
- Scale significantly with page count (e.g., 10 pages = 0.3 hours, 30 pages = 0.7 hours, 50+ pages = 1.0+ hours)

Use page count as the primary factor for adjusting time within effort levels. File size is secondary. Document type category (when provided) helps refine the estimate.

Round to the nearest 0.1 hour and sum for total billable time.

Documents:
${fileDescriptions}

IMPORTANT: Return an array of files with individual estimates. For each file, provide:
- filename: The actual file name (not "Document 1")
- pages: Number of pages (if available, otherwise null)
- hours: Estimated billable hours for this specific file

Do NOT include file size, effort level, or document type category.

Output exactly in this JSON format with no additional text, explanations, markdown, or preamble:

{
  "files": [
    {
      "filename": "Contract.pdf",
      "pages": 47,
      "hours": 0.5
    },
    {
      "filename": "Legal-Brief.pdf",
      "pages": 33,
      "hours": 1.0
    },
    {
      "filename": "Admin-Record.pdf",
      "pages": 4,
      "hours": 0.1
    }
  ]
}`;

      // Call Claude API with Haiku (cheap model for simple mode)
      console.log('Calling Claude API (Haiku) for simple mode...');
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
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '');
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
      if (!Array.isArray(parsedResponse.files) || parsedResponse.files.length === 0) {
        console.error('Invalid response structure:', parsedResponse);
        return NextResponse.json(
          { error: 'Invalid response format from AI. Please try again or enter manually.' },
          { status: 500 }
        );
      }

      // Calculate total hours and build description
      let totalHours = 0;
      const descriptionLines: string[] = [];

      for (const file of parsedResponse.files) {
        if (typeof file.hours !== 'number' || typeof file.filename !== 'string') {
          console.error('Invalid file structure:', file);
          return NextResponse.json(
            { error: 'Invalid file format from AI. Please try again or enter manually.' },
            { status: 500 }
          );
        }

        totalHours += file.hours;

        // Format: "filename - pages - hours" or "filename - hours" if no pages
        if (file.pages) {
          descriptionLines.push(`${file.filename} - ${file.pages} pages - ${file.hours} hours`);
        } else {
          descriptionLines.push(`${file.filename} - ${file.hours} hours`);
        }
      }

      const description = descriptionLines.join('\n');

      console.log('Returning simple mode estimate:', totalHours, 'hours');

      // Return the estimate
      return NextResponse.json({
        billable_hours: totalHours,
        description: description,
      });
    } else {
      // IN-DEPTH MODE: Full document analysis
      console.log('Processing in IN-DEPTH mode');
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
      const documentSummaries = files.map((file) => {
        return `"${file.name}"`;
      });

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

Documents: ${documentSummaries.join('; ')}

IMPORTANT: Return an array of files with individual estimates. For each file, provide:
- filename: The actual file name (use the real filename from the document list)
- pages: Number of pages (if relevant, otherwise null)
- hours: Estimated billable hours for this specific file

Do NOT include file size in the output.

Output exactly in this JSON format with no additional text, explanations, markdown, or preamble:

{
  "files": [
    {
      "filename": "Contract.pdf",
      "pages": 23,
      "hours": 0.5
    },
    {
      "filename": "MemoToClient.pdf",
      "pages": 5,
      "hours": 0.2
    },
    {
      "filename": "Brief.pdf",
      "pages": 33,
      "hours": 0.5
    }
  ]
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
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '');
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
      if (!Array.isArray(parsedResponse.files) || parsedResponse.files.length === 0) {
        console.error('Invalid response structure:', parsedResponse);
        return NextResponse.json(
          { error: 'Invalid response format from AI. Please try again or enter manually.' },
          { status: 500 }
        );
      }

      // Calculate total hours and build description
      let totalHours = 0;
      const descriptionLines: string[] = [];

      for (const file of parsedResponse.files) {
        if (typeof file.hours !== 'number' || typeof file.filename !== 'string') {
          console.error('Invalid file structure:', file);
          return NextResponse.json(
            { error: 'Invalid file format from AI. Please try again or enter manually.' },
            { status: 500 }
          );
        }

        totalHours += file.hours;

        // Format: "filename - pages - hours" or "filename - hours" if no pages
        if (file.pages) {
          descriptionLines.push(`${file.filename} - ${file.pages} pages - ${file.hours} hours`);
        } else {
          descriptionLines.push(`${file.filename} - ${file.hours} hours`);
        }
      }

      const description = descriptionLines.join('\n');

      console.log('Returning estimate:', totalHours, 'hours');

      // Return the estimate
      return NextResponse.json({
        billable_hours: totalHours,
        description: description,
      });
    }
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
