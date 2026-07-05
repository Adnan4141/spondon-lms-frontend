'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import {
  clearAuthStorage,
  initialsFromFullName,
  parseStoredAuthUser,
  type StoredAuthUser,
} from '@/features/admin/shared/admin-session';

export type TeacherSessionUser = StoredAuthUser & { id: string };

function syncTeacherSessionUser(): TeacherSessionUser | null {
  const parsed = parseStoredAuthUser();
  if (!parsed?.id) return null;
  return { ...parsed, id: parsed.id };
}

export function useTeacherSession() {
  const [user, setUser] = useState<TeacherSessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useLayoutEffect(() => {
    const sync = () => {
      setUser(syncTeacherSessionUser());
      setAuthChecked(true);
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

  const initials = useMemo(
    () => (user ? initialsFromFullName(user.fullName) : '…'),
    [user],
  );

  const isTeacher = user?.role === 'TEACHER';

  const logout = () => {
    clearAuthStorage();
    window.location.href = '/login';
  };

  const refresh = () => {
    setUser(syncTeacherSessionUser());
  };

  return { user, initials, authChecked, isTeacher, logout, refresh };
}
