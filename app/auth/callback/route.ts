import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://')
    ? rawNext
    : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email for new users
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const createdAt = new Date(user.created_at).getTime();
        const isNewUser = Date.now() - createdAt < 2 * 60 * 1000;
        if (isNewUser && user.email) {
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            undefined;
          sendWelcomeEmail(user.email, displayName);
        }
      }

      // If trying to access admin routes, verify admin status
      if (next.startsWith('/admin') && user) {
        const { data: isAdmin } = await (supabase.rpc as any)('is_admin', { user_uuid: user.id });

        // If not an admin, redirect to admin login with error
        if (!isAdmin) {
          return NextResponse.redirect(`${origin}/admin?error=access_denied`);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=authentication_failed`);
}
