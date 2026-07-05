import { format, parseISO } from 'date-fns';
import type { AttendanceStatus } from '@/lib/api/attendance';

export const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

export function cellKey(sessionId: string, studentId: string) {
  return `${sessionId}\t${studentId}`;
}

export function statusColor(s: AttendanceStatus | '') {
  if (s === 'PRESENT') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (s === 'ABSENT') return 'bg-rose-50 text-rose-800 border-rose-200';
  if (s === 'LATE') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-muted/40 text-muted-foreground border-border';
}

export function statusLabel(s: AttendanceStatus | '') {
  if (s === 'PRESENT') return 'P';
  if (s === 'ABSENT') return 'A';
  if (s === 'LATE') return 'L';
  return '–';
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthPreset(offset: 0 | 1): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toYmd(d), end: toYmd(last) };
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(month: string): string {
  try {
    return format(parseISO(`${month}-01`), 'MMM yyyy');
  } catch {
    return month;
  }
}

function monthIndex(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return y * 12 + (m - 1);
}

function indexToMonth(index: number): string {
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function buildMonthOptions(bounds?: {
  startMonth?: string | null;
  endMonth?: string | null;
}): { value: string; label: string }[] {
  let startIdx = monthIndex(currentMonth()) - 2;
  let endIdx = monthIndex(currentMonth()) + 11;

  if (bounds?.startMonth) startIdx = monthIndex(bounds.startMonth);
  if (bounds?.endMonth) endIdx = monthIndex(bounds.endMonth);

  if (startIdx > endIdx) {
    const tmp = startIdx;
    startIdx = endIdx;
    endIdx = tmp;
  }

  const options: { value: string; label: string }[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const value = indexToMonth(i);
    options.push({ value, label: formatMonthLabel(value) });
  }
  return options;
}

export function monthToDateRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  return { start: toYmd(d), end: toYmd(last) };
}
