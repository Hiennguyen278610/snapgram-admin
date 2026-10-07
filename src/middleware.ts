import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOGIN_PATH_REGEX = /^\/[^/]+\/admin\/login\/?$/;
const ADMIN_PATH_REGEX = /^\/[^/]+\/admin(\/|$)/;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_PATH_REGEX.test(pathname);
  const isLoginRoute = LOGIN_PATH_REGEX.test(pathname);

  const locale = pathname.split('/')[1] || routing.defaultLocale;
  const token = request.cookies.get('admin_access_token')?.value;

  // Rule 1: chưa login vào /admin/* (trừ login) → redirect login
  if (isAdminRoute && !isLoginRoute && !token) {
    const loginUrl = new URL(`/${locale}/admin/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rule 2: đã login vào /admin/login → redirect dashboard
  if (isLoginRoute && token) {
    const dashboardUrl = new URL(`/${locale}/admin/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
