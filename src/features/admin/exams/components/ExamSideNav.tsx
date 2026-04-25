'use client';

import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Layers,
  FileQuestion,
  BookMarked,
  ClipboardCheck,
  Trophy,
  PencilLine,
  ScanLine,
  GraduationCap,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  XCircle,
  Edit,
  Trash2,
  Globe,
  Lock,
} from 'lucide-react';
import type { Exam, ExamStatus } from '@/types/exam';
import { Button } from '@/components/ui/button';

export type ExamDetailTab =
  | 'overview'
  | 'sections'
  | 'questions'
  | 'blueprints'
  | 'results'
  | 'merit'
  | 'leaderboard'
  | 'evaluate'
  | 'omr'
  | 'courses'
  | 'analytics'
  | 'folder-rules';

interface NavItem {
  id: ExamDetailTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
  condition?: boolean;
}

interface ExamSideNavProps {
  exam: Exam;
  activeTab: ExamDetailTab;
  onTabChange: (tab: ExamDetailTab) => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  publishing: boolean;
}

function StatusDot({ status }: { status: ExamStatus }) {
  if (status === 'PUBLISHED') return <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />;
  if (status === 'CLOSED') return <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />;
  return <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />;
}

function statusLabel(status: ExamStatus) {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'CLOSED') return 'Closed';
  return 'Draft';
}

export function ExamSideNav({
  exam,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  onTogglePublish,
  publishing,
}: ExamSideNavProps) {
  const showOmr = exam.examEngine === 'OMR_BOOK' || exam.mode === 'OFFLINE';
  const hasWritten = exam.mode === 'WRITTEN';

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Overview',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Structure',
      items: [
        { id: 'sections', label: 'Sections', icon: Layers },
        {
          id: 'folder-rules',
          label: ['MULTI_SUBJECT', 'UNIVERSITY_SPECIAL'].includes(exam.examEngine) ? 'Subjects' : 'Folder Rules',
          icon: BookOpen,
        },
        { id: 'blueprints', label: 'Blueprints', icon: BookMarked },
      ],
    },
    {
      label: 'Content',
      items: [
        { id: 'questions', label: 'Sets & Questions', icon: FileQuestion },
        { id: 'courses', label: 'Courses', icon: GraduationCap },
        { id: 'omr', label: 'OMR', icon: ScanLine, condition: showOmr },
      ],
    },
    {
      label: 'Results',
      items: [
        { id: 'results', label: 'Results', icon: ClipboardCheck },
        { id: 'merit', label: 'Merit List', icon: Trophy },
        { id: 'evaluate', label: 'Evaluate', icon: PencilLine, condition: hasWritten },
      ],
    },
  ];

  const publishConfig = (() => {
    if (exam.status === 'PUBLISHED') {
      return { label: 'Unpublish', icon: Lock, cls: 'border-amber-200 text-amber-700 hover:bg-amber-50' };
    }
    if (exam.status === 'CLOSED') {
      return { label: 'Reopen', icon: Globe, cls: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' };
    }
    return { label: 'Publish', icon: Globe, cls: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' };
  })();
  const PublishIcon = publishConfig.icon;

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Exam identity */}
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          <StatusDot status={exam.status} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {statusLabel(exam.status)}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{exam.title}</p>
        {exam.examEngine && exam.examEngine !== 'REGULAR' && (
          <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
            {exam.examEngine.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.condition !== false);
          if (!visibleItems.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="w-full justify-start gap-2 h-8 rounded-xl border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit Exam
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePublish}
          disabled={publishing}
          className={cn('w-full justify-start gap-2 h-8 rounded-xl border text-xs font-semibold', publishConfig.cls)}
        >
          <PublishIcon className="h-3.5 w-3.5" />
          {publishing ? 'Saving…' : publishConfig.label}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="w-full justify-start gap-2 h-8 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Exam
        </Button>
      </div>
    </aside>
  );
}
