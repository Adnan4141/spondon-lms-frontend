export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function formatUserDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateRandomPassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function validatePasswordFields(
  pw: string,
  cpw: string,
  required: boolean,
  minLength: number,
): string | null {
  if (!pw && !cpw) {
    return required ? 'Password is required for this role.' : null;
  }
  if (pw.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  if (pw !== cpw) {
    return 'Passwords do not match.';
  }
  return null;
}

export function countByRole(
  roleSummary: { byRole: Record<string, number>; total: number },
  role: string,
): number {
  return roleSummary.byRole[role] ?? 0;
}
