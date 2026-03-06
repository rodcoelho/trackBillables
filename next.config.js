/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self';"
  },
];

const outlookHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://appsforoffice.microsoft.com https://*.cdn.office.net https://*.officeapps.live.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://*.cdn.office.net; connect-src 'self' https://*.supabase.co https://appsforoffice.microsoft.com https://*.cdn.office.net https://*.officeapps.live.com https://telemetry.firstpartyapps.oaspapps.com; frame-ancestors https://*.office.com https://*.office365.com https://*.outlook.com https://*.microsoft.com https://*.outlook.live.com; object-src 'none'; base-uri 'self';"
  },
];

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/outlook/(.*)',
        headers: outlookHeaders,
      },
      {
        source: '/((?!outlook/).*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
