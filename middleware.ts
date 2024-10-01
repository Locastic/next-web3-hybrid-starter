import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { sessionCookieName } from '@/lib/constants';
import { verifyToken, signToken, sessionExpiresIn } from '@/lib/auth/session';

const protectedRoutes = ['/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const sessionCookie = request.cookies.get(sessionCookieName);
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !sessionCookie) {
    console.error(`Cannot access protected route: ${pathname}, redirecting ..`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie) {
    try {
      const parsed = await verifyToken(sessionCookie.value);

      res.cookies.set({
        name: sessionCookieName,
        value: await signToken({
          ...parsed,
          expires: sessionExpiresIn.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: sessionExpiresIn,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete(sessionCookieName);
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
