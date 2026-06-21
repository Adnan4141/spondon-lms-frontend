export function formatPaymentCurrency(value: number | string) {
  return `৳${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(value))}`;
}

export function getStoredRole(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    return raw ? (JSON.parse(raw) as { role?: string })?.role || null : null;
  } catch {
    return null;
  }
}

export function getRoleHome(role: string | null): string {
  if (role === 'STUDENT') return '/student';
  if (role === 'TEACHER') return '/teacher';
  if (role === 'BRANCH_ADMIN') return '/admin/branch';
  if (role) return '/admin';
  return '/';
}

export function getPaymentSuccessDestination(role: string | null, invoiceId: string | null, redirectHref: string) {
  if (role === 'STUDENT') return '/student/payment';
  if (invoiceId) return `/admin/invoices?open=${invoiceId}`;
  return redirectHref;
}
