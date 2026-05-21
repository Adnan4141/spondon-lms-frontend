'use client';

const PERMISSIONS: Record<string, string[]> = {
  'sms:templates:manage': ['SUPER_ADMIN'],
};

export function hasPermission(role: string | null | undefined, permission: string) {
  if (!role) return false;
  return (PERMISSIONS[permission] || []).includes(role);
}

export function usePermission(role: string | null | undefined, permission: string) {
  return hasPermission(role, permission);
}
