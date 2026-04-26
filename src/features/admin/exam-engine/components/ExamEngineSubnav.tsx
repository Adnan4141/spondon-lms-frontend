'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type TabKey = 'details' | 'wizard' | 'leaderboard' | 'results';

const tabs: { key: TabKey; label: string; href: (examId: string) => string }[] = [
  { key: 'details', label: 'Details', href: (id) => `/admin/exam/${id}/details` },
  { key: 'wizard', label: 'Edit', href: (id) => `/admin/exam/${id}` },
  { key: 'leaderboard', label: 'Leaderboard', href: (id) => `/admin/exam/${id}/leaderboard` },
  { key: 'results', label: 'Results', href: (id) => `/admin/exam/${id}/results` },
];

function activeTab(pathname: string, examId: string): TabKey {
  if (pathname.includes('/details')) return 'details';
  if (pathname.includes('/leaderboard')) return 'leaderboard';
  if (pathname.includes('/results')) return 'results';
  const base = `/admin/exam/${examId}`;
  if (pathname === base || pathname === `${base}/`) return 'wizard';
  return 'wizard';
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
