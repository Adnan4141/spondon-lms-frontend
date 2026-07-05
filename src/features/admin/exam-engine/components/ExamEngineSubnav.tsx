'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  type ExamPortal,
  examBasePath,
  examLeaderboardPath,
  examPapersPath,
  examResultsPath,
  examSetupPath,
} from '../exam-portal-paths';

type TabKey = 'overview' | 'setup' | 'papers' | 'results' | 'leaderboard';

function tabsForPortal(portal: ExamPortal): { key: TabKey; label: string; href: (examId: string) => string }[] {
  return [
    { key: 'overview', label: 'Overview', href: (id) => examBasePath(portal, id) },
    { key: 'setup', label: 'Setup', href: (id) => examSetupPath(portal, id) },
    { key: 'papers', label: 'Papers', href: (id) => examPapersPath(portal, id) },
    { key: 'results', label: 'Results', href: (id) => examResultsPath(portal, id) },
    { key: 'leaderboard', label: 'Leaderboard', href: (id) => examLeaderboardPath(portal, id) },
  ];
}

function activeTab(pathname: string, examId: string, portal: ExamPortal): TabKey {
  if (pathname.includes('/setup')) return 'setup';
  if (pathname.includes('/papers') || pathname.includes('/pdf')) return 'papers';
  if (pathname.includes('/leaderboard')) return 'leaderboard';
  if (pathname.includes('/results')) return 'results';
  const base = examBasePath(portal, examId);
  if (pathname === base || pathname === `${base}/` || pathname.includes('/details')) return 'overview';
  return 'overview';
}

export function ExamEngineSubnav({
  examId,
  portal = 'admin',
}: {
  examId: string;
  portal?: ExamPortal;
}) {
  const pathname = usePathname() || '';
  const current = activeTab(pathname, examId, portal);
  const tabs = tabsForPortal(portal);

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm sm:text-sm"
      aria-label="Exam sections"
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
