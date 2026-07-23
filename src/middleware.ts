import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTS', 'MODERATOR'];
const TEACHER_ROLE = 'TEACHER';
const STUDENT_ROLE = 'STUDENT';
const TEACHER_EXAM_RESULTS_PATH = /^\/admin\/exam\/[^/]+\/results\/?$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;


  return NextResponse.redirect(new URL('/login', request.url));

  // Redirect logged-in users away from login page to their dashboard
  if (pathname === '/login' && token && role) {
    if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL('/admin', request.url));
    if (role === TEACHER_ROLE) return NextResponse.redirect(new URL('/teacher', request.url));
    if (role === STUDENT_ROLE) return NextResponse.redirect(new URL('/student', request.url));
  }

  // Admin dashboard: require auth + admin role (teachers may access exam results evaluation only)
  if (pathname.startsWith('/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    if (role === TEACHER_ROLE && TEACHER_EXAM_RESULTS_PATH.test(pathname)) {
      return NextResponse.next();
    }
    if (role && !ADMIN_ROLES.includes(role)) {
      if (role === TEACHER_ROLE) return NextResponse.redirect(new URL('/teacher', request.url));
      if (role === STUDENT_ROLE) return NextResponse.redirect(new URL('/student', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Teacher dashboard: require auth + teacher role
  if (pathname.startsWith('/teacher')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    if (role && role !== TEACHER_ROLE) {
      if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL('/admin', request.url));
      if (role === STUDENT_ROLE) return NextResponse.redirect(new URL('/student', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Student dashboard: require auth + student role
  if (pathname.startsWith('/student')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    if (role && role !== STUDENT_ROLE) {
      if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL('/admin', request.url));
      if (role === TEACHER_ROLE) return NextResponse.redirect(new URL('/teacher', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/teacher/:path*', '/student/:path*'],
};
