'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, ClipboardList, Eye, PenLine, Globe, Plus, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getExams, updateExam, deleteExam } from '@/lib/api/exams';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import type { Exam, ExamEngineType, ExamMode, ExamStatus } from '@/types/exam';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { ExamFormModal, ExamRow, ENGINE_CONFIG, MODE_CONFIG, STATUS_CONFIG } from './_components';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const RED = '#c8102e';

type StatusFilter = 'ALL' | ExamStatus;
type ModeFilter   = 'ALL' | ExamMode;
type EngineFilter = 'ALL' | ExamEngineType;

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminExamsPage() {
  const { toast } = useToast();

  // Data
  const [exams,    setExams]    = useState<Exam[]>([]);
  const [courses,  setCourses]  = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Filters
  const [search,       setSearch]       = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [modeFilter,   setModeFilter]   = useState<ModeFilter>('ALL');
  const [engineFilter, setEngineFilter] = useState<EngineFilter>('ALL');

  // Modal — null = closed, {} (no id) = create mode, Exam (with id) = edit mode
  const [editExam, setEditExam] = useState<Exam | null>(null);

  // Fetch on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getExams({ limit: 200 }),
      getCourses({ limit: 200 }),
      getBranches(),
    ]).then(([eRes, cRes, bRes]) => {
      if (eRes.success && eRes.data) setExams(eRes.data);
      if (cRes.success && cRes.data) setCourses(cRes.data);
      if (bRes.success && bRes.data) setBranches(bRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // Refetch exams (called after CUD operations)
  const refetch = async () => {
    const res = await getExams({
      limit: 200,
      courseId: courseFilter !== 'ALL' ? courseFilter : undefined,
    });
    if (res.success && res.data) setExams(res.data);
  };

  // Refetch when course filter changes
  useEffect(() => {
    if (loading) return;
    refetch();
  }, [courseFilter]);

  // Derived filtered list
  const filtered = useMemo(() => exams.filter(e => {
    const matchSearch = !search
      || e.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchMode   = modeFilter   === 'ALL' || e.mode   === modeFilter;
    const matchEngine = engineFilter === 'ALL' || (e.examEngine ?? 'REGULAR') === engineFilter;
    return matchSearch && matchStatus && matchMode && matchEngine;
  }), [exams, search, statusFilter, modeFilter, engineFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:     exams.length,
    published: exams.filter(e => e.status === 'PUBLISHED').length,
    draft:     exams.filter(e => e.status === 'DRAFT').length,
    online:    exams.filter(e => e.mode   === 'ONLINE').length,
  }), [exams]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaved = (exam: Exam) => {
    setExams(prev => {
      const idx = prev.findIndex(e => e.id === exam.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exam;
        return next;
      }
      return [exam, ...prev];
    });
    setEditExam(null);
    toast({ description: exam.id && exams.some(e => e.id === exam.id) ? 'Exam updated!' : 'Exam created!' });
  };

  const handlePublish = async (id: string) => {
    const res = await updateExam(id, { status: 'PUBLISHED' });
    if (res.success && res.data) {
      setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'PUBLISHED' } : e));
      toast({ description: 'Exam published!' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    const res = await deleteExam(id);
    if (res.success) {
      setExams(prev => prev.filter(e => e.id !== id));
      toast({ description: 'Exam deleted' });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-5">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Exam Manager</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Create and manage exams across all courses and branches
            </p>
          </div>
          <Button
            onClick={() => setEditExam({} as Exam)}
            className="gap-2 text-white"
            style={{ background: RED }}
          >
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Exams', val: stats.total,     icon: <ClipboardList className="h-4 w-4"/>, tc: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Published',   val: stats.published,  icon: <Eye           className="h-4 w-4"/>, tc: 'text-emerald-600',bg: 'bg-emerald-50'},
            { label: 'Drafts',      val: stats.draft,      icon: <PenLine       className="h-4 w-4"/>, tc: 'text-amber-600',  bg: 'bg-amber-50'  },
            { label: 'Online',      val: stats.online,     icon: <Globe         className="h-4 w-4"/>, tc: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', c.bg, c.tc)}>
                {c.icon}
              </div>
              <div>
                <p className={cn('text-xl font-black leading-none', c.tc)}>{c.val}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          {/* Search + Course filter */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exams..."
                className="pl-9"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-52">
                <BookOpen className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Courses</SelectItem>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Status</span>
            {(['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'] as StatusFilter[]).map(s => {
              const cfg = s !== 'ALL' ? STATUS_CONFIG[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer',
                    statusFilter === s
                      ? `${cfg?.bg ?? 'bg-slate-900'} ${cfg?.tc ?? 'text-white'} border-transparent`
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Mode pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Mode</span>
            {(['ALL', 'ONLINE', 'OFFLINE', 'WRITTEN'] as ModeFilter[]).map(m => {
              const cfg = m !== 'ALL' ? MODE_CONFIG[m] : null;
              return (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer',
                    modeFilter === m
                      ? `${cfg?.bg ?? 'bg-slate-900'} ${cfg?.tc ?? 'text-white'} border-transparent`
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Engine pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Type</span>
            {(['ALL', 'REGULAR', 'COMPETITIVE', 'MULTI_SUBJECT', 'OMR_BOOK'] as EngineFilter[]).map(en => {
              const cfg = en !== 'ALL' ? ENGINE_CONFIG[en] : null;
              return (
                <button
                  key={en}
                  onClick={() => setEngineFilter(en)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer',
                    engineFilter === en
                      ? `${cfg?.bg ?? 'bg-slate-900'} ${cfg?.tc ?? 'text-white'} border-transparent`
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
                  )}
                >
                  {en === 'ALL' ? 'ALL' : cfg?.label ?? en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    {['Exam Title', 'Questions', 'Duration', 'Marks', 'Sets', 'Status', 'Schedule', ''].map(h => (
                      <th
                        key={h}
                        className={cn(
                          'py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap',
                          h === 'Exam Title' ? 'text-left pl-4' : 'text-center',
                          h === '' && 'text-right pr-3',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-medium">No exams found.</p>
                        <p className="text-slate-300 text-xs mt-1">
                          {exams.length === 0 ? 'Click "Create Exam" to get started.' : 'Try adjusting your filters.'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map(exam => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      onEdit={e => setEditExam(e)}
                      onDelete={handleDelete}
                      onPublish={handlePublish}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400">
                Showing {filtered.length} of {exams.length} exam{exams.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Engine type legend */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Exam Engine Reference
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { engine: 'REGULAR'            as ExamEngineType, detail: 'Auto-graded. Result shown after schedule / immediately. Random question pick from bank.' },
              { engine: 'COMPETITIVE'        as ExamEngineType, detail: 'Teacher evaluates answers. Single / bulk / Excel result input. CQ and Written supported.' },
              { engine: 'MULTI_SUBJECT'      as ExamEngineType, detail: 'Per-subject marks, pass mark, compulsory/optional. Combined final result.' },
              { engine: 'OMR_BOOK'           as ExamEngineType, detail: 'Book format. Student scans via mobile. Auto-graded. Results visible on website.' },
              { engine: 'TALENT_HUNT'        as ExamEngineType, detail: 'Special competitive exam for talent discovery.' },
              { engine: 'UNIVERSITY_SPECIAL' as ExamEngineType, detail: 'University admission exam format with specialized evaluation.' },
            ]).map(item => {
              const cfg = ENGINE_CONFIG[item.engine];
              return (
                <div key={item.engine} className="flex items-start gap-2">
                  <span className={cn('block w-2 h-2 rounded-full shrink-0 mt-1.5', cfg.bg)} />
                  <div>
                    <span className="text-xs font-bold text-slate-700">{cfg.label} — </span>
                    <span className="text-xs text-slate-400">{item.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exam form modal */}
      <ExamFormModal
        open={editExam !== null}
        onClose={() => setEditExam(null)}
        onSaved={handleSaved}
        exam={editExam?.id ? editExam : null}
        courses={courses.map(c => ({ id: c.id, name: c.name }))}
        branches={branches}
      />

      <Toaster />
    </>
  );
}
