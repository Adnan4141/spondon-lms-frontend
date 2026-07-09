import type { LoginResponse } from '@/lib/api/auth';

const AUTH_MAX_AGE_SEC = 24 * 60 * 60;

function cookieAttributes(maxAge: number): string {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

/** Persist JWT + user for client API calls and Next.js middleware route guards. */
export function setAuthCookies(token: string, role: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `auth_token=${encodeURIComponent(token)}${cookieAttributes(AUTH_MAX_AGE_SEC)}`;
  document.cookie = `user_role=${encodeURIComponent(role)}${cookieAttributes(AUTH_MAX_AGE_SEC)}`;
}

export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  const attrs = cookieAttributes(0);
  document.cookie = `auth_token=;${attrs}`;
  document.cookie = `user_role=;${attrs}`;
}

export function persistAuthSession(data: LoginResponse): void {
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  setAuthCookies(data.token, data.user?.role || '');
}

export function resolvePostLoginPath(
  user: LoginResponse['user'],
  redirectTo?: string | null,
): string {
  if (user?.role === 'STUDENT' && !(user as { isMobileVerified?: boolean }).isMobileVerified) {
    return `/register?mobile=${encodeURIComponent(user.mobile)}&step=otp`;
  }

  let target = '/student';
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ACCOUNTS' || user?.role === 'MODERATOR') {
    target = '/admin';
  } else if (user?.role === 'BRANCH_ADMIN') {
    target = '/admin/branch';
  } else if (user?.role === 'TEACHER') {
    target = '/teacher';
  }

  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('/login')) {
    return redirectTo;
  }
  return target;
}
