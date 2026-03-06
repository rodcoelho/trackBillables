import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://trackbillables.com',
  'https://www.trackbillables.com',
  'https://localhost:3000',
  'null', // Outlook task pane may send null origin
];

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCorsPreflight(request: Request): NextResponse {
  const origin = request.headers.get('Origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
