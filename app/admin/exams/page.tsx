'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getExams, deleteExam, updateExam } from '@/lib/api/exams';
import type { Exam, ExamStatus, ExamMode, ExamType, ExamEngineType } from '@/types/exam';
import type { ExamsPagination } from '@/lib/api/exams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Monitor,
  FileText,
  Layers,
  BarChart3,
  Globe,
  BookOpen,
  CalendarRange,
  Users,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ExamCreatorWizard } from '@/features/admin/exams';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusConfig(status: ExamStatus) {
  switch (status) {
    case 'PUBLISHED': return { label: 'Published', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
    case 'CLOSED': return { label: 'Closed', class: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
    default: return { label: 'Draft', class: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock3 };
  }
}

function getModeConfig(mode: ExamMode) {
  switch (mode) {
    case 'ONLINE': return { label: 'Online', class: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Monitor };
    case 'OFFLINE': return { label: 'Offline', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileText };
    case 'WRITTEN': return { label: 'Written', class: 'bg-violet-50 text-violet-700 border-violet-200', icon: BookOpen };
  }
}

function getEngineLabel(engine?: ExamEngineType | null): string {
  switch (engine) {
    case 'COMPETITIVE': return 'Competitive';
    case 'MULTI_SUBJECT': return 'Multi-Subject';
    case 'UNIVERSITY_SPECIAL': return 'University';
    case 'TALENT_HUNT': return 'Talent Hunt';
    case 'OMR_BOOK': return 'OMR Book';
    default: return 'Regular';
  }
}

function getTypeLabel(type: ExamType): string {
  switch (type) {
    case 'PRACTICE': return 'Practice';
    case 'SCHEDULED': return 'Scheduled';
    case 'MODEL': return 'Model Test';
    case 'TALENT_HUNT': return 'Talent Hunt';
    case 'UNIVERSITY': return 'Admission';
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSchedule(startAt?: string | null, endAt?: string | null): string {
  if (!startAt && !endAt) return 'No schedule';
  if (startAt && !endAt) return formatDate(startAt);
  return `${formatDate(startAt)} → ${formatDate(endAt)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const { openModal, closeModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [pagination, setPagination] = useState<ExamsPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<ExamMode | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ExamType | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────

  const loadExams = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const res = await getExams({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        mode: modeFilter !== 'all' ? modeFilter : undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setExams(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, modeFilter, currentPage]);

  useEffect(() => { loadExams(); }, [loadExams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, modeFilter]);

  // ─── Local filtering (search + type on the current page) ──────────────────

  const filtered = exams.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.course?.name?.toLowerCase().includes(q);
  });

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: pagination?.total ?? exams.length,
    draft: exams.filter((e) => e.status === 'DRAFT').length,
    published: exams.filter((e) => e.status === 'PUBLISHED').length,
    closed: exams.filter((e) => e.status === 'CLOSED').length,
  };

  // ─── Bulk selection helpers ────────────────────────────────────────────────

  const allSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const openWizard = (exam?: Exam) => {
    openModal({
      title: exam ? 'Edit Exam' : 'Create Exam',
      description: exam ? 'Update exam configuration.' : 'Set up a new exam with the step-by-step builder.',
      className: 'sm:max-w-6xl h-[94vh]',
      content: (
        <ExamCreatorWizard
          exam={exam ?? null}
          onSuccess={async () => { await loadExams(); closeModal(); }}
          onClose={closeModal}
        />
      ),
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteExam(deleteTarget.id);
      toast({ title: 'Deleted', description: `"${deleteTarget.title}" removed.`, variant: 'success' });
      await loadExams();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    let failed = 0;
    for (const id of selectedIds) {
      try { await deleteExam(id); } catch { failed++; }
    }
    toast({
      title: failed === 0 ? 'Deleted' : `Deleted with ${failed} error(s)`,
      description: `${selectedIds.size - failed} exam(s) removed.`,
      variant: failed === 0 ? 'success' : 'destructive',
    });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    await loadExams();
  };

  const handleBulkPublish = async () => {
    setBulkPublishing(true);
    let failed = 0;
    for (const id of selectedIds) {
      try { await updateExam(id, { status: 'PUBLISHED' }); } catch { failed++; }
    }
    toast({
      title: failed === 0 ? 'Published' : `Published with ${failed} error(s)`,
      description: `${selectedIds.size - failed} exam(s) published.`,
      variant: failed === 0 ? 'success' : 'destructive',
    });
    setSelectedIds(new Set());
    setBulkPublishing(false);
    await loadExams();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    loadExams(page);
    setSelectedIds(new Set());
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 text-slate-900">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Exams</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all exams, question sets, results, and OMR.</p>
        </div>
        <Button
          onClick={() => openWizard()}
          className="h-10 rounded-xl bg-slate-900 text-white font-bold hover:bg-indigo-600 shadow-sm text-sm transition-colors"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Exams', value: stats.total, icon: ClipboardList, color: 'from-blue-600 to-indigo-600' },
          { label: 'Draft', value: stats.draft, icon: Clock3, color: 'from-slate-500 to-slate-600' },
          { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
          { label: 'Closed', value: stats.closed, icon: XCircle, color: 'from-rose-500 to-pink-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-md group-hover:scale-110 transition-transform', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="mt-0.5 text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bulk action bar ── */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3">
          <span className="text-sm font-bold text-indigo-700">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-xl border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold gap-1.5"
            disabled={bulkPublishing}
            onClick={handleBulkPublish}
          >
            {bulkPublishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Globe2 className="h-3.5 w-3.5" />}
            {bulkPublishing ? 'Publishing…' : 'Publish Selected'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-xl border-rose-300 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold gap-1.5"
            onClick={() => setShowBulkDeleteDialog(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-xl text-slate-500 text-xs font-semibold"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* ── Filter Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-[20px] border border-slate-200/60 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title or course…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 border-none bg-slate-50 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExamStatus | 'all')}>
          <SelectTrigger className="h-9 w-[140px] border-none bg-slate-50 rounded-xl text-sm font-medium">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as ExamMode | 'all')}>
          <SelectTrigger className="h-9 w-[130px] border-none bg-slate-50 rounded-xl text-sm font-medium">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
            <SelectItem value="WRITTEN">Written</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ExamType | 'all')}>
          <SelectTrigger className="h-9 w-[150px] border-none bg-slate-50 rounded-xl text-sm font-medium">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PRACTICE">Practice</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="MODEL">Model Test</SelectItem>
            <SelectItem value="TALENT_HUNT">Talent Hunt</SelectItem>
            <SelectItem value="UNIVERSITY">Admission</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="h-9 w-9 p-0 border-none bg-slate-50 rounded-xl hover:bg-slate-100 shrink-0"
          onClick={() => loadExams()}
        >
          <RefreshCw className={cn('h-4 w-4 text-slate-600', loading && 'animate-spin')} />
        </Button>

        {!loading && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-auto">
            {filtered.length} of {pagination?.total ?? exams.length} exam{(pagination?.total ?? exams.length) !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Loading exams…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="h-16 w-16 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center">
              <ClipboardList className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <p className="font-black text-slate-600">No exams found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'all' || modeFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try clearing your filters.'
                  : 'Create your first exam to get started.'}
              </p>
            </div>
            <Button onClick={() => openWizard()} className="h-9 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600">
              <Plus className="mr-1.5 h-4 w-4" />Create Exam
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                {/* Select all */}
                <TableHead className="w-10 pl-5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[40%]">Exam</TableHead>
                <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[110px]">Mode</TableHead>
                <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[110px]">Status</TableHead>
                <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500">Schedule</TableHead>
                <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[70px] text-center">Sets</TableHead>
                <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[80px] text-center">Attempts</TableHead>
                <TableHead className="py-3 pr-6 w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exam) => {
                const statusCfg = getStatusConfig(exam.status);
                const modeCfg = getModeConfig(exam.mode);
                const StatusIcon = statusCfg.icon;
                const ModeIcon = modeCfg.icon;
                const selected = selectedIds.has(exam.id);
                return (
                  <TableRow
                    key={exam.id}
                    className={cn(
                      'group border-b border-slate-50 transition-colors',
                      selected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/60',
                    )}
                  >
                    {/* Checkbox */}
                    <TableCell className="pl-5">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOne(exam.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                      />
                    </TableCell>

                    {/* Exam Title */}
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {exam.title}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          {exam.course && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <BookOpen className="h-3 w-3" />
                              {exam.course.name}
                            </span>
                          )}
                          <span className="text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                            {getTypeLabel(exam.type)}
                          </span>
                          {exam.examEngine && exam.examEngine !== 'REGULAR' && (
                            <span className="text-[10px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">
                              {getEngineLabel(exam.examEngine)}
                            </span>
                          )}
                          {exam.durationMinutes && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <Clock3 className="h-3 w-3" />
                              {exam.durationMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Mode */}
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide border px-2 py-1', modeCfg.class)}>
                        <ModeIcon className="h-3 w-3" />
                        {modeCfg.label}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide border px-2 py-1', statusCfg.class)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>
                    </TableCell>

                    {/* Schedule */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        {(exam.startAt || exam.endAt) && <CalendarRange className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                        {formatSchedule(exam.startAt, exam.endAt)}
                      </div>
                    </TableCell>

                    {/* Sets */}
                    <TableCell className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        {exam._count?.sets ?? exam.sets?.length ?? 0}
                      </span>
                    </TableCell>

                    {/* Attempts */}
                    <TableCell className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {exam._count?.attempts ?? 0}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4 pr-6">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-200 w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/exams/${exam.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" />View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openWizard(exam)} className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" />Edit Exam
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(exam)}
                              className="flex items-center gap-2 cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <p className="text-xs text-slate-500 font-medium">
              Page {pagination.page} of {pagination.pages} — {pagination.total} total
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl border-slate-200"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                const page = pagination.pages <= 7
                  ? i + 1
                  : currentPage <= 4
                    ? i + 1
                    : currentPage >= pagination.pages - 3
                      ? pagination.pages - 6 + i
                      : currentPage - 3 + i;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="icon"
                    className={cn('h-8 w-8 rounded-xl text-xs font-bold', page === currentPage ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200')}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl border-slate-200"
                disabled={currentPage >= pagination.pages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Single Delete Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[24px] border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently delete{' '}
              <span className="font-bold text-slate-700">"{deleteTarget?.title}"</span> and all associated sets, questions, and results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm">
              {deleting ? 'Deleting…' : 'Delete Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Dialog ── */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(open) => !open && setShowBulkDeleteDialog(false)}>
        <AlertDialogContent className="rounded-[24px] border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">Delete {selectedIds.size} Exams?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently delete all {selectedIds.size} selected exams including their sets, questions, attempts, and results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm">
              {bulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size} Exams`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
