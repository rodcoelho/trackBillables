import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/outlook/auth';
import { corsHeaders, handleCorsPreflight } from '@/lib/outlook/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false },
        { headers }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false },
        { headers }
      );
    }

    return NextResponse.json(
      { valid: true, user: { email: payload.email } },
      { headers }
    );
  } catch (error) {
    return NextResponse.json(
      { valid: false },
      { headers }
    );
  }
}
