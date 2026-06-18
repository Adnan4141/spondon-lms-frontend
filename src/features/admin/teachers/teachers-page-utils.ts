import type { User } from '@/lib/api/users';

export type TeachersStatusFilter = 'all' | 'ACTIVE' | 'BLOCKED';

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function filterTeachersByQuery(teachers: User[], query: string): User[] {
  const q = query.trim().toLowerCase();
  if (!q) return teachers;
  return teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(q) ||
      t.mobile.includes(q) ||
      (t.email?.toLowerCase().includes(q) ?? false),
  );
}
