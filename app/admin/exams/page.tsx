'use client';

/**
 * Admin Exams list — shadcn-only rewrite.
 *
 * Color tokens (Deep Navy / Warm Gold / Clean White) live in a single `C`
 * map so leaf components never embed raw hex values.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  Eye,
  Globe,
  PenLine,
  Plus,
  Search,
} from 'lucide-react';

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

import { getExams, updateExam, deleteExam } from '@/lib/api/exams';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import type {
  Exam,
  ExamEngineType,
  ExamMode,
  ExamStatus,
} from '@/types/exam';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';

import {
  ExamFormModal,
  ExamRow,
  ENGINE_CONFIG,
  MODE_CONFIG,
  STATUS_CONFIG,
} from './_components';

// ── Palette tokens ──────────────────────────────────────────────────────────
export const C = {
  navy: '#0F1E3C',
  navyInk: '#0B1730',
  gold: '#C9A85C',
  goldSoft: '#F3E7C7',
  paper: '#FFFFFF',
  mist: '#F5F7FB',
} as const;

// ── Types for filters ───────────────────────────────────────────────────────
type StatusFilter = 'ALL' | ExamStatus;
type ModeFilter = 'ALL' | ExamMode;
type EngineFilter = 'ALL' | ExamEngineType;

export default function AdminExamsPage() {
  const { toast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('ALL');
  const [engineFilter, setEngineFilter] = useState<EngineFilter>('ALL');

  const [editExam, setEditExam] = useState<Exam | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getExams({ limit: 200 }),
      getCourses({ limit: 200 }),
      getBranches(),
    ])
      .then(([eRes, cRes, bRes]) => {
        if (eRes.success && eRes.data) setExams(eRes.data);
        if (cRes.success && cRes.data) setCourses(cRes.data);
        if (bRes.success && bRes.data) setBranches(bRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    getExams({
      limit: 200,
      courseId: courseFilter !== 'ALL' ? courseFilter : undefined,
    }).then((res) => {
      if (res.success && res.data) setExams(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter]);

  const filtered = useMemo(
    () =>
      exams.filter((e) => {
        const matchSearch =
          !search || e.title.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
        const matchMode = modeFilter === 'ALL' || e.mode === modeFilter;
        const matchEngine =
          engineFilter === 'ALL' || (e.examEngine ?? 'REGULAR') === engineFilter;
        return matchSearch && matchStatus && matchMode && matchEngine;
      }),
    [exams, search, statusFilter, modeFilter, engineFilter],
  );

  const stats = useMemo(
    () => ({
      total: exams.length,
      published: exams.filter((e) => e.status === 'PUBLISHED').length,
      draft: exams.filter((e) => e.status === 'DRAFT').length,
      online: exams.filter((e) => e.mode === 'ONLINE').length,
    }),
    [exams],
  );

  const handleSaved = (exam: Exam) => {
    setExams((prev) => {
      const idx = prev.findIndex((e) => e.id === exam.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exam;
        return next;
      }
      return [exam, ...prev];
    });
    setEditExam(null);
    toast({ description: 'Exam saved' });
  };

  const handlePublish = async (id: string) => {
    const res = await updateExam(id, { status: 'PUBLISHED' });
    if (res.success && res.data) {
      setExams((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'PUBLISHED' as const } : e)),
      );
      toast({ description: 'Exam published' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    const res = await deleteExam(id);
    if (res.success) {
      setExams((prev) => prev.filter((e) => e.id !== id));
      toast({ description: 'Exam deleted' });
    }
  };

  const STAT_CARDS = [
    { label: 'Total Exams', value: stats.total, icon: ClipboardList },
    { label: 'Published', value: stats.published, icon: Eye },
    { label: 'Drafts', value: stats.draft, icon: PenLine },
    { label: 'Online', value: stats.online, icon: Globe },
  ] as const;

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: C.navyInk }}
            >
              Exam Manager
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Create and manage exams across all courses and branches
            </p>
          </div>
          <Button
            onClick={() => setEditExam({} as Exam)}
            style={{ backgroundColor: C.navy, color: C.paper }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAT_CARDS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: C.goldSoft, color: C.navy }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none" style={{ color: C.navyInk }}>
                      {s.value}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exams…"
                  className="pl-9"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-56">
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {(['DRAFT', 'PUBLISHED', 'CLOSED'] as ExamStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={modeFilter}
                onValueChange={(v) => setModeFilter(v as ModeFilter)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Modes</SelectItem>
                  {(['ONLINE', 'OFFLINE', 'WRITTEN'] as ExamMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_CONFIG[m].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={engineFilter}
                onValueChange={(v) => setEngineFilter(v as EngineFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Engines</SelectItem>
                  {(Object.keys(ENGINE_CONFIG) as ExamEngineType[]).map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENGINE_CONFIG[e].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No exams found.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {exams.length === 0
                    ? 'Click “Create Exam” to get started.'
                    : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-center">Duration</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Sets</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Schedule</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((exam) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      onEdit={(e) => setEditExam(e)}
                      onDelete={handleDelete}
                      onPublish={handlePublish}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filtered.length > 0 && (
              <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                Showing {filtered.length} of {exams.length} exam
                {exams.length !== 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engine legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Exam Engine Reference
            </CardTitle>
            <CardDescription>
              Quick notes on how each engine type behaves.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.keys(ENGINE_CONFIG) as ExamEngineType[]).map((k) => (
                <div key={k} className="flex items-start gap-2">
                  <Badge variant={ENGINE_CONFIG[k].variant} className="mt-0.5">
                    {ENGINE_CONFIG[k].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {ENGINE_CONFIG[k].desc}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ExamFormModal
        open={editExam !== null}
        onClose={() => setEditExam(null)}
        onSaved={handleSaved}
        exam={editExam?.id ? editExam : null}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        branches={branches}
      />

      <Toaster />
    </>
  );
}
