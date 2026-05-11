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

  // 1. Define your main domains
  const mainDomains = ['ilusion.io', 'www.ilusion.io', 'localhost:3000'];
  
  // 2. Check if the current host is a main domain or a Vercel preview domain
  const isMainDomain = mainDomains.includes(hostname) || hostname.endsWith('.vercel.app');
  
  // 3. Extract subdomain only if it's NOT a main domain
  if (!isMainDomain) {
    const domainParts = hostname.split('.');
    if (domainParts.length >= 2) {
      const subdomain = domainParts[0];
      return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}${url.search}`, request.url));
    }
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
