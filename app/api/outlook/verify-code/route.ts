// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/outlook/auth';
import { corsHeaders, handleCorsPreflight } from '@/lib/outlook/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400, headers }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    // Find the most recent unused, unexpired code for this email
    const { data: authCode, error: codeError } = await adminClient
      .from('outlook_auth_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeError || !authCode) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400, headers }
      );
    }

    // Check attempts
    if (authCode.attempts >= 5) {
      // Mark as used to prevent further attempts
      await adminClient
        .from('outlook_auth_codes')
        .update({ used: true })
        .eq('id', authCode.id);

      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 400, headers }
      );
    }

    // Increment attempts
    await adminClient
      .from('outlook_auth_codes')
      .update({ attempts: authCode.attempts + 1 })
      .eq('id', authCode.id);

    // Check code
    if (authCode.code !== code.trim()) {
      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 400, headers }
      );
    }

    // Mark code as used
    await adminClient
      .from('outlook_auth_codes')
      .update({ used: true })
      .eq('id', authCode.id);

    // Look up user
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const user = users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400, headers }
      );
    }

    // Generate JWT
    const token = await generateToken(user.id, normalizedEmail);

    return NextResponse.json(
      { token, user: { email: normalizedEmail } },
      { headers }
    );
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500, headers }
    );
  }
}
