import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If trying to access admin routes, verify admin status
      if (next.startsWith('/admin')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: isAdmin } = await (supabase.rpc as any)('is_admin', { user_uuid: user.id });

          // If not an admin, redirect to admin login with error
          if (!isAdmin) {
            return NextResponse.redirect(`${origin}/admin?error=access_denied`);
          }
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
