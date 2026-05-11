import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/', 
  '/api(.*)', 
  '/secret(.*)', 
  '/sign-in(.*)', 
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain (assuming main domains are ilusion.io, localhost:3000, etc.)
  const isLocalhost = hostname.includes('localhost');
  const domainParts = hostname.split('.');
  
  // If it's something.localhost:3000 or something.ilusion.io
  const hasSubdomain = isLocalhost ? domainParts.length >= 2 : domainParts.length >= 3;
  const isWww = domainParts[0] === 'www';
  
  if (hasSubdomain && !isWww) {
    const subdomain = domainParts[0];
    // Rewrite to our hidden drop route
    return NextResponse.rewrite(new URL(`/_drop/${subdomain}${url.pathname}${url.search}`, request.url));
  }

  // Normal routing
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
