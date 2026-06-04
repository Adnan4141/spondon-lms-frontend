'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type TabKey = 'overview' | 'setup' | 'papers' | 'results' | 'leaderboard';

const tabs: { key: TabKey; label: string; href: (examId: string) => string }[] = [
  { key: 'overview', label: 'Overview', href: (id) => `/admin/exam/${id}` },
  { key: 'setup', label: 'Setup', href: (id) => `/admin/exam/${id}/setup` },
  { key: 'papers', label: 'Papers', href: (id) => `/admin/exam/${id}/papers` },
  { key: 'results', label: 'Results', href: (id) => `/admin/exam/${id}/results` },
  { key: 'leaderboard', label: 'Leaderboard', href: (id) => `/admin/exam/${id}/leaderboard` },
];

function activeTab(pathname: string, examId: string): TabKey {
  if (pathname.includes('/setup')) return 'setup';
  if (pathname.includes('/papers') || pathname.includes('/pdf')) return 'papers';
  if (pathname.includes('/leaderboard')) return 'leaderboard';
  if (pathname.includes('/results')) return 'results';
  const base = `/admin/exam/${examId}`;
  if (pathname === base || pathname === `${base}/` || pathname.includes('/details')) return 'overview';
  return 'overview';
}

export function ExamEngineSubnav({ examId }: { examId: string }) {
  const pathname = usePathname() || '';
  const current = activeTab(pathname, examId);

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm sm:text-sm"
      aria-label="Exam admin sections"
    >
      {tabs.map((t) => {
        const on = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href(examId)}
            className={cn(
              'rounded-md px-3 py-2 transition-colors',
              on ? 'bg-[#0D1B35] text-[#E2C98A]' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
