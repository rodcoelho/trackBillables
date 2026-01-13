import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is accessing admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow unauthenticated access to the admin login page only
    const isAdminLoginPage = request.nextUrl.pathname === '/admin';

    if (!isAdminLoginPage) {
      // Protect all other admin routes
      if (!user) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // Check if user is an admin
      const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id });

      if (!isAdmin) {
        // Not an admin, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // If already authenticated and on admin login page, check if admin and redirect
      if (user) {
        const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id });
        if (isAdmin) {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      }
    }
  }

  return response;
}
