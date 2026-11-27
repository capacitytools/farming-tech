import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run this logic for blog paths
  if (pathname.startsWith('/blog/')) {
    try {
      // Connect to Supabase directly in the middleware
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Check if the requested path exists in the redirects table
      const { data } = await supabase
        .from('redirects')
        .select('to_path, code')
        .eq('from_path', pathname)
        .single();

      if (data) {
        // 🚨 410 GONE: Show a "Removed" page 🚨
        if (data.code === 410) {
          return new NextResponse(
            `<html><body style="font-family:sans-serif;text-align:center;padding:50px;">
              <h1 style="color:#166534;">This page has been removed</h1>
              <p>The article you are looking for is no longer available.</p>
              <a href="/blog" style="color:#166534;font-weight:bold;">← Browse all insights</a>
            </body></html>`,
            { status: 410, headers: { 'content-type': 'text/html' } }
          );
        }

        // 🚨 301 REDIRECT: Send them to the new URL 🚨
        const url = request.nextUrl.clone();
        url.pathname = data.to_path;
        return NextResponse.redirect(url, data.code || 301);
      }
    } catch (err) {
      // If Supabase fails, just let the request continue to the page
      console.error('Redirect check failed:', err);
    }
  }

  // Otherwise, let the request continue
  return NextResponse.next();
}

// Ensure middleware only runs on specific paths
export const config = {
  matcher: '/blog/:path*',
};