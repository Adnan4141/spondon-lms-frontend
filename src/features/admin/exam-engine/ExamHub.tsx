'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useModalStore } from '@/store/modalStore';
import { cn } from '@/lib/utils';
import { deleteExam, duplicateExam, getExams } from '@/lib/api/exams';
import type { Exam, ExamMode, ExamStatus } from '@/types/exam';
import type { ExamProductType } from './types';

type HubTab = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'UPCOMING' | 'OFFLINE' | 'NEEDS_ACTION';
type TypeFilter = 'ALL' | ExamProductType;

const TABS: { id: HubTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'OFFLINE', label: 'Offline' },
  { id: 'NEEDS_ACTION', label: 'Needs action' },
];

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'ALL', label: 'All types' },
  { id: 'MCQ', label: 'MCQ' },
  { id: 'WRITTEN', label: 'Written' },
  { id: 'COMBINED', label: 'MCQ + Written' },
  { id: 'MULTI', label: 'Multi-subject' },
];

function isUpcoming(exam: Exam) {
  return Boolean(exam.startAt && new Date(exam.startAt).getTime() > Date.now());
}

function statusTone(status: ExamStatus) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'CLOSED') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

function modeTone(mode: ExamMode) {
  if (mode === 'ONLINE') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (mode === 'HYBRID') return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
  if (mode === 'WRITTEN') return 'bg-violet-50 text-violet-700 border-violet-200';
  return 'bg-orange-50 text-orange-700 border-orange-200';
}

const TYPE_TONE: Record<ExamProductType, string> = {
  MCQ: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  WRITTEN: 'bg-violet-50 text-violet-700 border-violet-200',
  COMBINED: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  MULTI: 'bg-amber-50 text-amber-800 border-amber-200',
};

const TYPE_LABEL: Record<ExamProductType, string> = {
  MCQ: 'MCQ',
  WRITTEN: 'Written',
  COMBINED: 'MCQ + Written',
  MULTI: 'Multi-subject',
};

/** Derive the new ProductType from an exam — falls back to wizard settings, then to legacy heuristics on mode. */
function readProductType(exam: Exam): ExamProductType {
  const wizard = (exam.settings?.examWizard as Record<string, unknown> | undefined) ?? undefined;
  const stored = wizard?.productType;
  if (stored === 'MCQ' || stored === 'WRITTEN' || stored === 'COMBINED' || stored === 'MULTI') {
    return stored;
  }
  if (exam.examEngine === 'MULTI_SUBJECT') return 'MULTI';
  if (exam.mode === 'WRITTEN') return 'WRITTEN';
  if (exam.mode === 'HYBRID') return 'COMBINED';
  return 'MCQ';
}

function formatSchedule(exam: Exam): string {
  if (!exam.startAt && !exam.endAt) return 'Any time';
  const fmt = (raw?: string | null) =>
    raw
      ? new Date(raw).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : '—';
  if (exam.startAt && exam.endAt) return `${fmt(exam.startAt)} → ${fmt(exam.endAt)}`;
  if (exam.startAt) return `From ${fmt(exam.startAt)}`;
  return `Until ${fmt(exam.endAt)}`;
}

function setCount(exam: Exam) {
  return exam._count?.sets ?? exam.sets?.length ?? 0;
}

function hasGeneratedSets(exam: Exam) {
  return setCount(exam) > 0;
}

function needsAction(exam: Exam) {
  if (exam.status === 'DRAFT') return true;
  if (!hasGeneratedSets(exam)) return true;
  if (!exam.pdfUrl) return true;
  return false;
}

function readinessLabel(exam: Exam) {
  if (!hasGeneratedSets(exam)) return { label: 'Needs sets', tone: 'border-amber-200 bg-amber-50 text-amber-800' };
  if (!exam.pdfUrl) return { label: 'PDF needed', tone: 'border-amber-200 bg-amber-50 text-amber-800' };
  return { label: 'Ready', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
}

function DisabledHint({ children }: { children: string }) {
  return <span className="ml-auto text-[10px] font-semibold text-slate-400">{children}</span>;
}

export function ExamHub() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<HubTab>('ALL');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ExamStatus>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | ExamMode>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const { openModal } = useModalStore();
  const toast = useAdminToast();
  const router = useRouter();

  useEffect(() => {
    getExams({ limit: 200 })
      .then((r) => {
        if (r.success && r.data) setExams(r.data);
        else {
          setExams([]);
          setError(r.message ?? 'Could not load exams.');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load exams.');
        setExams([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const draft = exams.filter((x) => x.status === 'DRAFT').length;
    const published = exams.filter((x) => x.status === 'PUBLISHED').length;
    const upcoming = exams.filter(isUpcoming).length;
    const online = exams.filter((x) => x.mode === 'ONLINE').length;
    const offline = exams.filter((x) => x.mode === 'OFFLINE').length;
    const action = exams.filter(needsAction).length;
    return [
      { label: 'Draft', value: draft },
      { label: 'Published', value: published },
      { label: 'Upcoming', value: upcoming },
      { label: 'Online', value: online },
      { label: 'Offline', value: offline },
      { label: 'Needs action', value: action },
    ];
  }, [exams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams.filter((exam) => {
      if (tab === 'DRAFT' && exam.status !== 'DRAFT') return false;
      if (tab === 'PUBLISHED' && exam.status !== 'PUBLISHED') return false;
      if (tab === 'UPCOMING' && !isUpcoming(exam)) return false;
      if (tab === 'OFFLINE' && exam.mode !== 'OFFLINE') return false;
      if (tab === 'NEEDS_ACTION' && !needsAction(exam)) return false;
      if (statusFilter !== 'ALL' && exam.status !== statusFilter) return false;
      if (modeFilter !== 'ALL' && exam.mode !== modeFilter) return false;
      if (typeFilter !== 'ALL' && readProductType(exam) !== typeFilter) return false;
      if (!q) return true;
      return [exam.title, exam.course?.name, exam.branch?.name, exam.batch?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [exams, modeFilter, query, statusFilter, tab, typeFilter]);

  const handleDuplicate = async (exam: Exam) => {
    setDuplicatingId(exam.id);
    try {
      const response = await duplicateExam(exam.id);
      if (response.success && response.data) {
        toast({ title: 'Exam duplicated', description: `New draft: ${response.data.title}` });
        setExams((prev) => [response.data as Exam, ...prev]);
        router.push(`/admin/exam/${response.data.id}?step=1`);
      } else {
        toast({
          title: 'Duplicate failed',
          description: response.message ?? 'Could not duplicate this exam.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Duplicate failed',
        description: err instanceof Error ? err.message : 'Could not duplicate this exam.',
        variant: 'destructive',
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteExam = (exam: Exam) => {
    openModal({
      title: 'Delete exam',
      description: 'This removes the exam and related sections, sets, and configuration.',
      className: 'sm:max-w-lg',
      content: (
        <ConfirmationModal
          title="Delete this exam?"
          description={`"${exam.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete exam"
          variant="danger"
          onConfirm={async () => {
            try {
              const r = await deleteExam(exam.id);
              if (r.success) {
                toast({ title: 'Exam deleted', description: `"${exam.title}" was removed.` });
                setExams((prev) => prev.filter((x) => x.id !== exam.id));
              } else {
                toast({
                  title: 'Delete failed',
                  description: r.message ?? 'Could not delete this exam.',
                  variant: 'destructive',
                });
              }
            } catch (err) {
              toast({
                title: 'Delete failed',
                description: err instanceof Error ? err.message : 'Could not delete this exam.',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  return (
    <div className="mx-auto max-w-full space-y-5 px-4 py-6 sm:px-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-[#0D1B35] md:text-3xl">Exam operations</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Manage drafts, schedules, PDFs, leaderboards, and results from one place.
          </p>
        </div>
        <Button asChild className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]">
          <Link href="/admin/exam/new" className="gap-2">
            <Plus className="h-4 w-4" /> New exam
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{m.label}</p>
            <p className="mt-2 text-2xl font-black text-[#0D1B35]">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-md bg-slate-100 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-bold transition-colors',
                  tab === item.id ? 'bg-white text-[#0D1B35] shadow-sm' : 'text-slate-500 hover:text-slate-900',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exam, course, branch"
                className="h-9 border-slate-200 pl-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ExamStatus)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as 'ALL' | ExamMode)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All mode</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="WRITTEN">Written</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-3 py-2">
          {TYPE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTypeFilter(item.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors',
                typeFilter === item.id
                  ? 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]'
                  : 'border-slate-200 text-slate-500 hover:border-[#C8A96E] hover:text-[#0D1B35]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading exams...</p>
        ) : error ? (
          <p className="p-10 text-center text-sm font-semibold text-rose-600">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No exams match this view.</p>
            <p className="mt-1 text-xs text-slate-500">Adjust filters or create a new exam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Sets</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((exam) => {
                  const productType = readProductType(exam);
                  const sets = setCount(exam);
                  const readiness = readinessLabel(exam);
                  const editDisabled = exam.status === 'CLOSED';
                  const pdfDisabled = sets === 0;
                  const resultsDisabled = exam.status === 'DRAFT' && sets === 0;
                  const leaderboardDisabled = exam.status === 'DRAFT' || exam.showLeaderboard === false;
                  const duplicateDisabled = duplicatingId === exam.id;
                  const deleteDisabled = exam.status === 'PUBLISHED' && Number(exam._count?.attempts ?? 0) > 0;
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/exam/${exam.id}/details`}
                          className="block max-w-[320px] truncate font-bold text-slate-900 hover:text-[#0D1B35] hover:underline"
                        >
                          {exam.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {exam.course?.name ?? 'No course'} {exam.branch?.name ? `· ${exam.branch.name}` : ''}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline" className={cn('text-[10px] font-black uppercase', readiness.tone)}>
                            {readiness.label}
                          </Badge>
                          {exam.status === 'DRAFT' && sets === 0 ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-black uppercase text-amber-800">
                              Setup needed
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('whitespace-nowrap text-[10px] font-black uppercase', TYPE_TONE[productType])}
                        >
                          {TYPE_LABEL[productType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-black uppercase', statusTone(exam.status))}
                        >
                          {exam.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-[10px] font-black uppercase', modeTone(exam.mode))}>
                          {exam.mode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">{formatSchedule(exam)}</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-700">
                        {sets} {sets === 1 ? 'set' : 'sets'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" className="h-8 bg-[#0D1B35] px-3 text-xs text-[#E2C98A] hover:bg-[#1E2F55]">
                            <Link href={`/admin/exam/${exam.id}/details`}>
                              <Eye className="mr-1 h-3.5 w-3.5" /> View
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="icon" variant="outline" className="h-8 w-8" aria-label={`Actions for ${exam.title}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <DropdownMenuLabel className="text-xs text-slate-500">Exam actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/exam/${exam.id}/details`}>
                                  <Eye className="h-4 w-4" /> View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={editDisabled} asChild={!editDisabled}>
                                {editDisabled ? (
                                  <>
                                    <Pencil className="h-4 w-4" /> Edit <DisabledHint>Closed exam</DisabledHint>
                                  </>
                                ) : (
                                  <Link href={`/admin/exam/${exam.id}`}>
                                    <Pencil className="h-4 w-4" /> Edit
                                  </Link>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={pdfDisabled} asChild={!pdfDisabled}>
                                {pdfDisabled ? (
                                  <>
                                    <Download className="h-4 w-4" /> PDF / Paper <DisabledHint>Generate sets first</DisabledHint>
                                  </>
                                ) : (
                                  <Link href={`/admin/exam/${exam.id}/pdf`}>
                                    <Download className="h-4 w-4" /> PDF / Paper
                                  </Link>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={resultsDisabled} asChild={!resultsDisabled}>
                                {resultsDisabled ? (
                                  <>
                                    <BarChart3 className="h-4 w-4" /> Results & evaluation <DisabledHint>Draft not ready</DisabledHint>
                                  </>
                                ) : (
                                  <Link href={`/admin/exam/${exam.id}/results`}>
                                    <BarChart3 className="h-4 w-4" /> Results & evaluation
                                  </Link>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={leaderboardDisabled} asChild={!leaderboardDisabled}>
                                {leaderboardDisabled ? (
                                  <>
                                    <Trophy className="h-4 w-4" /> Leaderboard <DisabledHint>{exam.status === 'DRAFT' ? 'Draft not ready' : 'Disabled'}</DisabledHint>
                                  </>
                                ) : (
                                  <Link href={`/admin/exam/${exam.id}/leaderboard`}>
                                    <Trophy className="h-4 w-4" /> Leaderboard
                                  </Link>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled={duplicateDisabled} onClick={() => void handleDuplicate(exam)}>
                                <Copy className="h-4 w-4" /> Duplicate
                                {duplicateDisabled ? <DisabledHint>Working</DisabledHint> : null}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={deleteDisabled}
                                variant="destructive"
                                onClick={() => handleDeleteExam(exam)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                                {deleteDisabled ? <DisabledHint>Has attempts</DisabledHint> : null}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
