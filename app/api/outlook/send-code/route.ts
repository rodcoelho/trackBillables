// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCode } from '@/lib/outlook/auth';
import { corsHeaders, handleCorsPreflight } from '@/lib/outlook/cors';
import { sendVerificationCodeEmail } from '@/lib/email/send';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    // Rate limit: max 5 codes per email per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await adminClient
      .from('outlook_auth_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .gte('created_at', tenMinutesAgo);

    if (count && count >= 5) {
      // Return generic success to avoid info leak
      return NextResponse.json(
        { message: 'If an account exists with that email, a code has been sent.' },
        { headers }
      );
    }

    // Look up user - generic success if not found
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    const user = users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json(
        { message: 'If an account exists with that email, a code has been sent.' },
        { headers }
      );
    }

    // Generate and store code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await adminClient.from('outlook_auth_codes').insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

    // Send code via email
    await sendVerificationCodeEmail(normalizedEmail, code);

    return NextResponse.json(
      { message: 'If an account exists with that email, a code has been sent.' },
      { headers }
    );
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Failed to send code' },
      { status: 500, headers }
    );
  }
}
