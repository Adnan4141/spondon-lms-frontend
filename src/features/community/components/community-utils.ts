export function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function initials(name?: string) {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function voteSum(votes?: Array<{ value: number }>) {
  return votes?.reduce((sum, vote) => sum + Number(vote.value || 0), 0) ?? 0;
}

export function normalizeAttachments(input: unknown): Array<any> {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'object') return [input];
  return [];
}
