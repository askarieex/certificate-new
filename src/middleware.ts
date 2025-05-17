import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that don't require authentication
const publicPaths = ['/login', '/api/login'];

export function middleware(request: NextRequest) {
  // Check if the path is public
  const path = request.nextUrl.pathname;
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }

  // Check for authentication
  const authToken = request.cookies.get('auth_token')?.value;
  
  // If no token is found, redirect to login
  if (!authToken) {
    // For API routes, return 401 Unauthorized
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For non-API routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists, allow the request
  return NextResponse.next();
}

// Configure which paths this middleware applies to
export const config = {
  matcher: [
    // Apply to all paths except _next, static files, and public paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}; 