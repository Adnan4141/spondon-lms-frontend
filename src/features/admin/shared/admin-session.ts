'use client';

import { useEffect, useMemo, useState } from 'react';

/** Shape of `user` JSON from login / localStorage (may gain fields after profile updates). */
export type StoredAuthUser = {
  id?: string;
  fullName: string;
  email?: string | null;
  mobile?: string;
  role?: string;
  branchId?: string | null;
  profileImage?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  BRANCH_ADMIN: 'Branch Admin',
  ACCOUNTS: 'Accounts',
  MODERATOR: 'Moderator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

export function formatUserRoleLabel(role: string | undefined | null): string {
  if (!role) return 'User';
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return role
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function initialsFromFullName(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? '';
    const b = parts[parts.length - 1][0] ?? '';
    return (a + b).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export function parseStoredAuthUser(): StoredAuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw) as Partial<StoredAuthUser>;
    const fullName = typeof u.fullName === 'string' ? u.fullName.trim() : '';
    if (!fullName) return null;
    return {
      id: typeof u.id === 'string' ? u.id : undefined,
      fullName,
      email: u.email ?? null,
      mobile: typeof u.mobile === 'string' ? u.mobile : undefined,
      role: typeof u.role === 'string' ? u.role : undefined,
      branchId: u.branchId ?? null,
      profileImage: typeof u.profileImage === 'string' ? u.profileImage : null,
    };
  } catch {
    return null;
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  document.cookie = 'auth_token=; path=/; max-age=0';
  document.cookie = 'user_role=; path=/; max-age=0';
}

/**
 * Current session user for admin shell (header / sidebar). Re-reads on window focus
 * and on `storage` (other tabs); safe after client-side login redirect.
 */
export function useAdminSession() {
  const [user, setUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const sync = () => {
      setUser(parseStoredAuthUser());
    };
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'auth_token') sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const initials = useMemo(() => (user ? initialsFromFullName(user.fullName) : '…'), [user]);
  const roleLabel = useMemo(() => formatUserRoleLabel(user?.role), [user]);

  return { user, initials, roleLabel };
}
