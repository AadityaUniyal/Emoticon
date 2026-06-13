import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

const isMockAuth = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
                   process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('REPLACE_ME') ||
                   process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('ZW1vc2Vuc2UtdGVzdC');

// Simple bypass middleware for Mock/Offline evaluation mode
const mockMiddleware = () => {
  return NextResponse.next();
};

export default isMockAuth 
  ? mockMiddleware 
  : clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    });

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
