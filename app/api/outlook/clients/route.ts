// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken, extractTokenFromRequest } from '@/lib/outlook/auth';
import { corsHeaders, handleCorsPreflight } from '@/lib/outlook/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
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

    const adminClient = createAdminClient();
    const { data: clients, error } = await adminClient
      .from('clients')
      .select('id, name')
      .eq('user_id', payload.userId)
      .order('name');

    if (error) {
      console.error('Failed to fetch clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ clients: clients || [] }, { headers });
  } catch (error) {
    console.error('Outlook clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
