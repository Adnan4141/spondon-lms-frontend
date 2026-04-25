'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  createExam,
  updateExam,
  addQuestionsToSet,
  createExamSet,
  regenerateExamPdf,
  regenerateSolveSheet,
  generateSetPdf,
  getExamPdfDownloadUrl,
  getExamById,
} from '@/lib/api/exams';
import { getQuestionFolderTree, type FolderTreeNode } from '@/lib/api/question-bank';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { CreateExamDto, Exam, ExamEngineType, ExamSet, ExamType, ExamMode, ExamStatus } from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronRight, Search, X, Folder, FileText, Download, Send, Save, ArrowLeft, ArrowRight, AlertTriangle, Loader2, ChevronsUpDown, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ─── Types ──────────────────────────────────────────────────────────────────
interface WizardState {
  // Step 1 - Basics
  title: string;
  courseId: string;
  branchId: string;
  batchId: string;
  language: string;
  type: ExamType;
  mode: ExamMode;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  allowedAttempts: number;
  leaderboard: boolean;
  percentile: boolean;
  solveSheet: boolean;
  omr: boolean;
  examEngine: ExamEngineType;
  // Step 2 - Method
  method: 'folder' | 'blueprint' | 'manual' | 'import';
  // Step 3 - Config
  selectedFolders: Set<string>;
  mcqPassageCount: number;
  mcqSingleCount: number;
  cqCount: number;
  shortCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
  setCount: number;
  shuffle: boolean;
  // Step 5 - Publish
  status: ExamStatus;
  notifyInApp: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
}

interface ExamCreatorWizardProps {
  exam?: Exam | null;
  onSuccess: () => Promise<void>;
  onClose: () => void;
  actingTeacherUserId?: string | null;
}

const STEPS = [
  { label: 'Basics', sub: 'Title, course, type' },
  { label: 'Method', sub: 'How to fill' },
  { label: 'Sets & generate', sub: 'Folders + counts' },
  { label: 'Downloads', sub: 'Export sets' },
  { label: 'Publish', sub: 'Go live' },
];

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'SCHEDULED', label: 'Weekly test' },
  { value: 'MODEL', label: 'Model test' },
  { value: 'UNIVERSITY', label: 'Admission' },
  { value: 'TALENT_HUNT', label: 'Talent Hunt' },
];

const EXAM_MODES: { value: ExamMode; label: string; accent?: string }[] = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline / Hall', accent: 'amber' },
];

const SET_COLORS = [
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#EAF3DE', color: '#3B6D11' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#E1F5EE', color: '#085041' },
];

function setLabel(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : `Set ${index + 1}`;
}

function toLocalDatetimeInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseLocalDatetimeInput(s: string): Date | undefined {
  if (!s?.trim()) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function sortExamSets(sets: ExamSet[] | undefined): ExamSet[] {
  return [...(sets ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

function initialSelectedFoldersFromExam(exam: Exam | null | undefined): Set<string> {
  const subjects = exam?.subjects;
  if (!subjects?.length) return new Set();
  const folderIds: string[] = [];
  for (const sub of subjects) {
    for (const rule of sub.folderRules ?? []) {
      if (rule.folderId) folderIds.push(rule.folderId);
    }
  }
  return new Set(folderIds);
}

function treeFolderAndQuestionTotals(nodes: FolderTreeNode[]): { folders: number; questions: number } {
  let folders = 0;
  let questions = 0;
  function walk(list: FolderTreeNode[]) {
    for (const n of list) {
      folders += 1;
      questions += n.questionCount ?? n.counts?.total ?? 0;
      walk(n.children ?? []);
    }
  }
  walk(nodes);
  return { folders, questions };
}

function collectIdsWithChildren(nodes: FolderTreeNode[]): Set<string> {
  const ids = new Set<string>();
  function walk(list: FolderTreeNode[]) {
    for (const n of list) {
      const ch = n.children ?? [];
      if (ch.length) {
        ids.add(n.id);
        walk(ch);
      }
    }
  }
  walk(nodes);
  return ids;
}

function subtreeTypeTotals(n: FolderTreeNode): { mcq: number; cq: number; short: number; questions: number } {
  let mcq = 0;
  let cq = 0;
  let short = 0;
  let questions = 0;
  function w(x: FolderTreeNode) {
    const c = x.counts ?? { mcqSingle: 0, mcqPassage: 0, cq: 0, short: 0, total: 0 };
    mcq += (c.mcqSingle ?? 0) + (c.mcqPassage ?? 0);
    cq += c.cq ?? 0;
    short += c.short ?? 0;
    questions += x.questionCount ?? c.total ?? 0;
    (x.children ?? []).forEach(w);
  }
  w(n);
  return { mcq, cq, short, questions };
}

function formatRowCounts(mcq: number, cq: number, short: number): string {
  const parts: string[] = [];
  if (mcq) parts.push(`${mcq}M`);
  if (cq) parts.push(`${cq}C`);
  if (short) parts.push(`${short}S`);
  return parts.length ? parts.join('·') : '0Q';
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function ExamCreatorWizard({ exam, onSuccess, onClose, actingTeacherUserId }: ExamCreatorWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseComboOpen, setCourseComboOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [folderTreeLoading, setFolderTreeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(exam || null);
  const [generating, setGenerating] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const sortedSets = useMemo(() => sortExamSets(generatedExam?.sets), [generatedExam?.sets]);


  const [st, setSt] = useState<WizardState>({
    title: exam?.title || '',
    courseId: exam?.courseId || '',
    branchId: exam?.branchId || '',
    batchId: exam?.batchId || '',
    language: exam?.language || 'bn',
    type: exam?.type || 'PRACTICE',
    mode: exam?.mode || 'ONLINE',
    startAt: exam?.startAt ? new Date(exam.startAt).toISOString().slice(0, 16) : '',
    endAt: exam?.endAt ? new Date(exam.endAt).toISOString().slice(0, 16) : '',
    durationMinutes: exam?.durationMinutes || 25,
    allowedAttempts: exam?.allowedAttempts || 1,
    leaderboard: exam?.showLeaderboard ?? true,
    percentile: exam?.showPercentile ?? true,
    solveSheet: exam?.solveSheetVisibility === 'IMMEDIATELY',
    omr: false,
    examEngine: exam?.examEngine || 'REGULAR',
    method: 'folder',
    selectedFolders: initialSelectedFoldersFromExam(exam),
    mcqPassageCount: 3,
    mcqSingleCount: 10,
    cqCount: 4,
    shortCount: 0,
    marksPerQuestion: 1,
    negativeMarks: 0.25,
    setCount: exam?.totalSets || 3,
    shuffle: true,
    status: exam?.status || 'DRAFT',
    notifyInApp: true,
    notifySms: false,
    notifyEmail: false,
    notifyPush: false,
  });

  const update = useCallback((partial: Partial<WizardState>) => {
    setSt(prev => ({ ...prev, ...partial }));
  }, []);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          getCourses({ status: 'ACTIVE', limit: 500 }),
          getBranches(),
        ]);
        if (cRes.success && cRes.data) setCourses(cRes.data);
        if (bRes.success && bRes.data) setBranches(bRes.data);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load batches when course changes
  useEffect(() => {
    if (!st.courseId) { setBatches([]); return; }
    (async () => {
      try {
        const res = await getBatches({ courseId: st.courseId, limit: 100 });
        if (res.success && res.data) setBatches(res.data.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
      } catch { /* ignore */ }
    })();
  }, [st.courseId]);

  // Load folder tree when entering step 3 (Sets & generate)
  useEffect(() => {
    if (step !== 2) {
      setFolderTreeLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!st.courseId?.trim()) {
        setFolderTree([]);
        setFolderTreeLoading(false);
        return;
      }
      setFolderTreeLoading(true);
      try {
        const res = await getQuestionFolderTree(st.courseId, actingTeacherUserId || undefined);
        if (cancelled) return;
        if (res.success && res.data) setFolderTree(res.data);
        else {
          setFolderTree([]);
          toast({
            title: 'Folders unavailable',
            description: res.message || 'Could not load the question folder tree.',
            variant: 'destructive',
          });
        }
      } catch (e) {
        if (!cancelled) {
          setFolderTree([]);
          toast({
            title: 'Folders unavailable',
            description: e instanceof Error ? e.message : 'Network error loading folders.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setFolderTreeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, st.courseId, actingTeacherUserId, toast]);

  const navigateTo = useCallback((s: number) => {
    if (s <= maxStep + 1 && s >= 0 && s < STEPS.length) {
      setStep(s);
      setMaxStep(prev => Math.max(prev, s));
    }
  }, [maxStep]);

  const basicsComplete = Boolean(st.courseId?.trim() && st.title.trim());

  const advance = useCallback(() => {
    if (step === 0 && !basicsComplete) {
      if (!st.courseId?.trim()) {
        toast({
          title: 'Course required',
          description: 'Choose a course before continuing.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Title required',
          description: 'Enter an exam title before continuing.',
          variant: 'destructive',
        });
      }
      return;
    }
    navigateTo(step + 1);
  }, [step, navigateTo, basicsComplete, st.courseId, st.title, toast]);

  const totalQuestionsPerSet = st.mcqPassageCount + st.mcqSingleCount + st.cqCount + st.shortCount;

  // ─── Step 1: Basics ─────────────────────────────────────────────────────
  const renderBasics = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Exam basics</div>
      <div className="text-xs text-slate-400 mb-4">Define exam identity and scheduling.</div>

      <WizardLabel>Exam title</WizardLabel>
      <Input
        placeholder="e.g. VAP Bio-01 Weekly MCQ 2025"
        value={st.title}
        onChange={(e) => update({ title: e.target.value })}
        className="text-sm"
      />

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
        <FieldWrap label="Course">
          {(() => {
            const selectedCourse = courses.find(c => c.id === st.courseId);
            const filteredCourses = courseSearch.trim()
              ? courses.filter(c => c.name.toLowerCase().includes(courseSearch.trim().toLowerCase()))
              : courses;
            return (
              <Popover open={courseComboOpen} onOpenChange={(o) => { setCourseComboOpen(o); if (!o) setCourseSearch(''); }}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={courseComboOpen}
                    className="h-9 w-full justify-between text-sm font-normal"
                  >
                    <span className={cn('truncate text-left', !selectedCourse && 'text-muted-foreground')}>
                      {selectedCourse ? selectedCourse.name : 'Select course…'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="border-b p-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search courses…"
                        className="h-8 pl-8 text-sm"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    <button
                      type="button"
                      onClick={() => { update({ courseId: '', batchId: '' }); setCourseComboOpen(false); }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      — None —
                    </button>
                    {filteredCourses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { update({ courseId: c.id, batchId: '' }); setCourseComboOpen(false); setCourseSearch(''); }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
                          st.courseId === c.id && 'bg-primary/10 font-medium',
                        )}
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{c.name}</span>
                        {st.courseId === c.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                    {filteredCourses.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">No courses found</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })()}
        </FieldWrap>
        <FieldWrap label="Branch">
          <Select value={st.branchId || '__all__'} onValueChange={(v) => update({ branchId: v === '__all__' ? '' : v })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All branches —</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
        <FieldWrap label="Batch">
          <Select value={st.batchId || '__none__'} onValueChange={(v) => update({ batchId: v === '__none__' ? '' : v })} disabled={!st.courseId}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrap>
        <FieldWrap label="Language">
          <Select value={st.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bn">Bengali</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrap>
      </div>

      <WizardLabel>Exam type</WizardLabel>
      <BadgeRow options={EXAM_TYPES} value={st.type} onChange={(v) => update({ type: v as ExamType })} />

      <WizardLabel>Mode</WizardLabel>
      <BadgeRow options={EXAM_MODES} value={st.mode} onChange={(v) => update({ mode: v as ExamMode })} />

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
        <FieldWrap label="Start">
          <DateTimePicker
            date={parseLocalDatetimeInput(st.startAt)}
            setDate={(d) => update({ startAt: d ? toLocalDatetimeInput(d) : '' })}
            placeholder="Start date & time"
            className="h-9 w-full rounded-md border-slate-200 bg-white text-sm font-normal shadow-sm"
          />
        </FieldWrap>
        <FieldWrap label="End">
          <DateTimePicker
            date={parseLocalDatetimeInput(st.endAt)}
            setDate={(d) => update({ endAt: d ? toLocalDatetimeInput(d) : '' })}
            placeholder="End date & time"
            className="h-9 w-full rounded-md border-slate-200 bg-white text-sm font-normal shadow-sm"
          />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-3">
        <FieldWrap label="Duration (min)">
          <Input
            type="number"
            min={5}
            value={st.durationMinutes}
            onChange={(e) => update({ durationMinutes: +e.target.value || 5 })}
            className="text-sm"
          />
        </FieldWrap>
        <FieldWrap label="Attempts">
          <Input
            type="number"
            min={1}
            value={st.allowedAttempts}
            onChange={(e) => update({ allowedAttempts: +e.target.value || 1 })}
            className="text-sm"
          />
        </FieldWrap>
        <FieldWrap label="Engine">
          <Select value={st.examEngine} onValueChange={(v) => update({ examEngine: v as ExamEngineType })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGULAR">Standard (MCQ)</SelectItem>
              <SelectItem value="COMPETITIVE">Competitive</SelectItem>
              <SelectItem value="MULTI_SUBJECT">Multi-Subject</SelectItem>
              <SelectItem value="UNIVERSITY_SPECIAL">University Special</SelectItem>
              <SelectItem value="TALENT_HUNT">Talent Hunt</SelectItem>
              <SelectItem value="OMR_BOOK">Hall OMR</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrap>
      </div>

      {/* Engine-specific guidance */}
      {st.examEngine === 'OMR_BOOK' && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium text-amber-800">OMR Mode</p>
          <p className="text-xs text-amber-700 mt-1">Students answer on physical OMR sheets. Upload scanned sheets in the OMR tab after creating the exam. Auto-grading available.</p>
        </div>
      )}
      {st.examEngine === 'MULTI_SUBJECT' && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-medium text-blue-800">Multi-Subject Exam</p>
          <p className="text-xs text-blue-700 mt-1">Configure subjects in the Folder Rules tab after creation. Each subject has its own marks allocation and question pool.</p>
        </div>
      )}
      {st.examEngine === 'UNIVERSITY_SPECIAL' && (
        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-xs font-medium text-violet-800">University Special</p>
          <p className="text-xs text-violet-700 mt-1">Designed for admission-style exams. Supports mixed MCQ + Written (CQ) sections with separate scoring.</p>
        </div>
      )}

      <WizardLabel>Options</WizardLabel>
      <Toggle label="Leaderboard" checked={st.leaderboard} onChange={(v) => update({ leaderboard: v })} />
      <Toggle label="Percentile display" checked={st.percentile} onChange={(v) => update({ percentile: v })} />
      <Toggle label="Solve sheet visible after submission" checked={st.solveSheet} onChange={(v) => update({ solveSheet: v })} />
      {(st.examEngine === 'OMR_BOOK' || st.mode === 'OFFLINE') && (
        <Toggle label="OMR offline upload enabled" checked={st.omr} onChange={(v) => update({ omr: v })} />
      )}
    </>
  );

  // ─── Step 2: Method ─────────────────────────────────────────────────────
  const renderMethod = () => {
    // Engine-specific method recommendations
    const isOmr = st.examEngine === 'OMR_BOOK';
    const isMultiSubject = st.examEngine === 'MULTI_SUBJECT';

    return (
    <>
      <div className="text-[15px] font-medium text-slate-900">Question fill method</div>
      <div className="text-xs text-slate-400 mb-4">
        {isOmr
          ? 'OMR exams typically use folder random or manual pick.'
          : isMultiSubject
          ? 'Multi-subject exams work best with the blueprint method.'
          : 'Choose how the paper gets populated.'}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MethodCard
          selected={st.method === 'folder'}
          onClick={() => update({ method: 'folder' })}
          icon={<Folder className="h-4 w-4 text-blue-700" />}
          iconBg="bg-blue-50"
          title="Folder random"
          sub="Browse nested folders, set type counts, auto-sample per set."
          recommended
        />
        <MethodCard
          selected={st.method === 'blueprint'}
          onClick={() => update({ method: 'blueprint' })}
          icon={<FileText className="h-4 w-4 text-violet-700" />}
          iconBg="bg-violet-50"
          title="Blueprint / multi-subject"
          sub="Subject-level plan validated against bank counts before generating."
        />
        <MethodCard
          selected={st.method === 'manual'}
          onClick={() => update({ method: 'manual' })}
          icon={<FileText className="h-4 w-4 text-amber-700" />}
          iconBg="bg-amber-50"
          title="Manual / bulk pick"
          sub="Hand-pick question IDs or paste a list. Full control."
        />
        <MethodCard
          selected={st.method === 'import'}
          onClick={() => update({ method: 'import' })}
          icon={<Download className="h-4 w-4 text-green-700" />}
          iconBg="bg-green-50"
          title="Import from exam"
          sub="Copy ExamQuestion links from a previous set. Skips duplicates."
        />
      </div>
    </>
  );
  };

  // ─── Step 3: Sets & Generate ────────────────────────────────────────────
  const renderSetsGenerate = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Sets &amp; question generation</div>
      <div className="text-xs text-slate-400 mb-4">Browse nested folders, configure type counts, and generate variant sets.</div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        {/* Left: Folder tree */}
        <div>
          <WizardLabel className="mt-0">Browse &amp; select folders</WizardLabel>
          <FolderTreePanel
            tree={folderTree}
            treeLoading={folderTreeLoading}
            selectedFolders={st.selectedFolders}
            onSelectionChange={(folders) => update({ selectedFolders: folders })}
            courseSelected={Boolean(st.courseId)}
          />

          <WizardLabel>Saved rule set</WizardLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select defaultValue="__preset__">
              <SelectTrigger className="h-9 w-full flex-1">
                <SelectValue placeholder="Load a preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__preset__">— load a preset —</SelectItem>
                <SelectItem value="vap-bio">VAP Weekly Bio standard</SelectItem>
                <SelectItem value="vap-model">VAP Model Test Bio+Phy</SelectItem>
                <SelectItem value="adm">Admission Full Syllabus</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" className="shrink-0 text-xs" disabled>
              Save as rule set
            </Button>
          </div>
        </div>

        {/* Right: Config */}
        <div className="space-y-3">
          <WizardLabel className="mt-0">Questions per set</WizardLabel>
          <div className="grid grid-cols-2 gap-3">
            <TypeCard dot="#378ADD" title="MCQ passage" sub="passages + child MCQs" value={st.mcqPassageCount} onChange={v => update({ mcqPassageCount: v })} />
            <TypeCard dot="#85B7EB" title="MCQ single" sub="standalone MCQs" value={st.mcqSingleCount} onChange={v => update({ mcqSingleCount: v })} />
            <TypeCard dot="#639922" title="CQ" sub="creative / structured" value={st.cqCount} onChange={v => update({ cqCount: v })} />
            <TypeCard dot="#BA7517" title="Short / written" sub="optional" value={st.shortCount} onChange={v => update({ shortCount: v })} />
          </div>

          <WizardLabel>Marks</WizardLabel>
          <div className="grid grid-cols-2 gap-3">
            <MarksInput label="Per question" value={st.marksPerQuestion} onChange={(v) => update({ marksPerQuestion: v })} />
            <MarksInput label="Negative mark" value={st.negativeMarks} onChange={(v) => update({ negativeMarks: v })} />
          </div>

          <WizardLabel>Set variants (A–Z)</WizardLabel>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500">Number of sets</span>
            <Input
              type="number"
              className="h-9 w-16 text-center text-sm font-medium"
              min={1}
              max={26}
              value={st.setCount}
              onChange={(e) => update({ setCount: Math.max(1, Math.min(26, +e.target.value || 1)) })}
            />
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: st.setCount }, (_, i) => (
                <span key={i} className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 border border-slate-200 text-slate-500">
                  Set {setLabel(i)}
                </span>
              ))}
            </div>
          </div>
          <Toggle label="Shuffle questions independently per set" checked={st.shuffle} onChange={v => update({ shuffle: v })} />

          <PoolWarning folderTree={folderTree} selectedFolders={st.selectedFolders} mcqPassageCount={st.mcqPassageCount} mcqSingleCount={st.mcqSingleCount} cqCount={st.cqCount} />

          <SummaryStrip st={st} totalQuestionsPerSet={totalQuestionsPerSet} />

          {st.selectedFolders.size === 0 && (
            <p className="text-xs text-red-600 mt-1">Select at least one folder before generating.</p>
          )}
          {!basicsComplete && (
            <p className="mt-1 text-xs text-amber-800">
              Complete step 1: select a course and enter an exam title before generating.
            </p>
          )}

          <button
            className="w-full py-2.5 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={st.selectedFolders.size === 0 || generating || !basicsComplete}
            onClick={handleGenerate}
          >
            {generating ? <><Loader2 className="h-4 w-4 inline animate-spin mr-2" />Generating...</> : 'Generate sets'}
          </button>
        </div>
      </div>
    </>
  );

  // ─── Step 4: Downloads ──────────────────────────────────────────────────
  const renderDownloads = () => {
    const setsForCards: ExamSet[] =
      sortedSets.length > 0
        ? sortedSets
        : Array.from({ length: st.setCount }, (_, i) => ({
            id: '',
            examId: generatedExam?.id ?? '',
            name: setLabel(i),
            createdAt: '',
          }));

    return (
      <>
        <div className="text-[15px] font-medium text-slate-900">Export &amp; download</div>
        <div className="text-xs text-slate-400 mb-4">Download each set for offline hall distribution or preview in browser.</div>

        {!generatedExam?.id ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-3">
            Save and generate questions first (step 3), then return here to download PDFs.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-4">
          <DlButton onClick={() => handleBulkDownload()} disabled={!generatedExam?.id || pdfBusy === 'bulk-pdf'}>
            {pdfBusy === 'bulk-pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            All sets — PDF
          </DlButton>
          <DlButton
            onClick={() => toast({ title: 'DOCX export', description: 'Combined DOCX export is not available yet.' })}
            disabled={!generatedExam?.id}
          >
            All sets — DOCX
          </DlButton>
          <DlButton onClick={() => handleSolveSheet()} disabled={!generatedExam?.id || pdfBusy === 'solve'}>
            {pdfBusy === 'solve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Solve sheet
          </DlButton>
          <DlButton onClick={() => toast({ title: 'OMR', description: 'OMR template generation coming soon' })}>OMR template</DlButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {setsForCards.map((setRow, i) => {
            const label = setRow.name;
            const co = SET_COLORS[i % SET_COLORS.length];
            const setId = setRow.id || null;
            const busy = setId ? pdfBusy === `set-${setId}` : false;
            const canPdf = Boolean(generatedExam?.id && setId);
            return (
              <div key={setId || `placeholder-${label}`} className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-medium"
                    style={{ background: co.bg, color: co.color }}
                  >
                    {label}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">Set {label}</div>
                    <div className="text-[10px] text-slate-400">
                      {totalQuestionsPerSet} Qs · {st.shuffle ? 'shuffled' : 'ordered'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-blue-500 bg-blue-50 py-1 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canPdf || busy}
                    onClick={() => setId && handleSetPdf(label, setId)}
                  >
                    {busy ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : 'PDF'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-slate-200 bg-slate-50 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-white disabled:opacity-50"
                    disabled
                  >
                    DOCX
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-slate-200 bg-slate-50 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canPdf || busy}
                    onClick={() => setId && handleSetPdf(label, setId)}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ─── Step 5: Publish ────────────────────────────────────────────────────
  const renderPublish = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Publish exam</div>
      <div className="text-xs text-slate-400 mb-4">Review everything and go live. Status can be changed anytime.</div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Status" value={<StatusBadge status={st.status} />} />
        <StatCard label="Sets generated" value={st.setCount} sub={Array.from({ length: st.setCount }, (_, i) => setLabel(i)).join(' · ')} />
        <StatCard label="Questions / set" value={totalQuestionsPerSet} sub={`${st.mcqPassageCount}P · ${st.mcqSingleCount}S-MCQ · ${st.cqCount}CQ · ${st.shortCount}Short`} />
        <StatCard label="Folders used" value={st.selectedFolders.size} sub="source folders selected" />
      </div>

      <WizardLabel>Publish action</WizardLabel>
      <BadgeRow
        options={[
          { value: 'DRAFT', label: 'Keep draft' },
          { value: 'PUBLISHED', label: 'Publish now' },
          { value: 'CLOSED', label: 'Schedule (auto at start time)' },
        ]}
        value={st.status}
        onChange={v => update({ status: v as ExamStatus })}
      />

      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <div className="text-xs font-medium text-slate-900 mb-3">Notify enrolled students</div>
        <CheckRow label="In-app bell" checked={st.notifyInApp} onChange={v => update({ notifyInApp: v })} />
        <CheckRow label="SMS" checked={st.notifySms} onChange={v => update({ notifySms: v })} />
        <CheckRow label="Email" checked={st.notifyEmail} onChange={v => update({ notifyEmail: v })} />
        <CheckRow label="Push notification" checked={st.notifyPush} onChange={v => update({ notifyPush: v })} />

        <div className="mt-3 p-2 bg-white rounded-md border border-slate-100 text-[11px] text-slate-400">
          Recipient preview: <b className="text-slate-600">enrolled students</b> across batches — {branches.find(b => b.id === st.branchId)?.name || 'All branches'}
        </div>
      </div>
    </>
  );

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!st.courseId?.trim()) {
      toast({
        title: 'Course required',
        description: 'Go back to step 1 and select a course. Exams must be linked to a course.',
        variant: 'destructive',
      });
      return;
    }
    if (!st.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Go back to step 1 and enter an exam title.',
        variant: 'destructive',
      });
      return;
    }
    if (st.selectedFolders.size === 0) return;

    try {
      setGenerating(true);

      let examId = generatedExam?.id;

      const examPayload: CreateExamDto = {
        title: st.title.trim(),
        courseId: st.courseId.trim(),
        branchId: st.branchId?.trim() || '',
        batchId: st.batchId?.trim() || undefined,
        type: st.type,
        mode: st.mode,
        examEngine: st.examEngine,
        startAt: st.startAt || undefined,
        endAt: st.endAt || undefined,
        durationMinutes: st.durationMinutes || undefined,
        allowedAttempts: st.allowedAttempts,
        status: 'DRAFT',
        showLeaderboard: st.leaderboard,
        showPercentile: st.percentile,
        solveSheetVisibility: st.solveSheet ? 'IMMEDIATELY' : 'HIDDEN',
        language: st.language,
        totalSets: st.setCount,
        settings: {
          marksPerQuestion: st.marksPerQuestion,
          negativeMarking: st.negativeMarks,
        },
      };
      if (actingTeacherUserId) examPayload.teacherUserId = actingTeacherUserId;

      if (!examId) {
        const createRes = await createExam(examPayload);
        if (!createRes.success || !createRes.data) throw new Error('Failed to create exam');
        examId = createRes.data.id;
        setGeneratedExam(createRes.data);
      } else {
        await updateExam(examId, examPayload);
      }

      const refreshedAfterSave = await getExamById(examId, { teacherUserId: actingTeacherUserId ?? undefined });
      let baseSetId = sortExamSets(refreshedAfterSave.data?.sets).find((s) => s.name === 'A')?.id;
      if (!baseSetId) {
        const setRes = await createExamSet({ examId, name: 'A' });
        if (!setRes.success || !setRes.data?.id) throw new Error('Failed to create exam set A');
        baseSetId = setRes.data.id;
      }

      const folderIds = Array.from(st.selectedFolders);
      const addRes = await addQuestionsToSet({
        examSetId: baseSetId,
        folderIds,
        shuffleQuestions: st.shuffle,
        autoSetCount: st.setCount,
        count: totalQuestionsPerSet,
        cqCount: st.cqCount,
        mcqSingleCount: st.mcqSingleCount,
        mcqPassageCount: st.mcqPassageCount,
        marks: st.marksPerQuestion,
        negativeMarks: st.negativeMarks,
      });

      if (!addRes.success) throw new Error(addRes.message || 'Failed to add questions');

      const refreshed = await getExamById(examId, { teacherUserId: actingTeacherUserId ?? undefined });
      if (refreshed.success && refreshed.data) {
        setGeneratedExam(refreshed.data);
      }

      toast({
        title: 'Success',
        description: `Generated ${st.setCount} set(s) with ${totalQuestionsPerSet} questions each`,
        variant: 'success',
      });

      setStep(3);
      setMaxStep((prev) => Math.max(prev, 3));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const openPdfUrl = (url: string, sameTab = false) => {
    const href = getExamPdfDownloadUrl(url);
    if (!href) {
      toast({ title: 'Error', description: 'Missing PDF URL', variant: 'destructive' });
      return;
    }
    if (sameTab) {
      window.location.assign(href);
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBulkDownload = async () => {
    if (!generatedExam?.id) return;
    const key = 'bulk-pdf';
    try {
      setPdfBusy(key);
      const res = await regenerateExamPdf(generatedExam.id, 2);
      if (!res.success || !res.data?.pdfUrl) {
        toast({
          title: 'Could not generate PDF',
          description: res.message || 'Ensure sets have questions, then try again.',
          variant: 'destructive',
        });
        return;
      }
      openPdfUrl(res.data.pdfUrl);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setPdfBusy(null);
    }
  };

  const handleSolveSheet = async () => {
    if (!generatedExam?.id) return;
    try {
      setPdfBusy('solve');
      const res = await regenerateSolveSheet(generatedExam.id);
      if (!res.success || !res.data?.solveSheetUrl) {
        toast({
          title: 'Could not generate solve sheet',
          description: res.message || 'Try again after questions are added.',
          variant: 'destructive',
        });
        return;
      }
      openPdfUrl(res.data.solveSheetUrl);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to generate solve sheet',
        variant: 'destructive',
      });
    } finally {
      setPdfBusy(null);
    }
  };

  const handleSetPdf = async (setName: string, setId: string) => {
    if (!generatedExam?.id || !setId) return;
    const key = `set-${setId}`;
    try {
      setPdfBusy(key);
      const res = await generateSetPdf(generatedExam.id, setId, 2);
      if (!res.success || !res.data?.pdfUrl) {
        toast({
          title: `Set ${setName}`,
          description: res.message || 'Could not generate PDF for this set.',
          variant: 'destructive',
        });
        return;
      }
      openPdfUrl(res.data.pdfUrl);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : `Failed to generate PDF for Set ${setName}`,
        variant: 'destructive',
      });
    } finally {
      setPdfBusy(null);
    }
  };

  const handlePublish = async () => {
    if (!st.courseId?.trim() || !st.title.trim()) {
      toast({
        title: 'Missing basics',
        description: 'Select a course and enter a title (step 1) before saving.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);

      let examId = generatedExam?.id;
      const payload: CreateExamDto = {
        title: st.title.trim(),
        courseId: st.courseId.trim(),
        branchId: st.branchId?.trim() || '',
        batchId: st.batchId?.trim() || undefined,
        type: st.type,
        mode: st.mode,
        examEngine: st.examEngine,
        startAt: st.startAt || undefined,
        endAt: st.endAt || undefined,
        durationMinutes: st.durationMinutes || undefined,
        allowedAttempts: st.allowedAttempts,
        status: st.status,
        showLeaderboard: st.leaderboard,
        showPercentile: st.percentile,
        solveSheetVisibility: st.solveSheet ? 'IMMEDIATELY' : 'HIDDEN',
        language: st.language,
        totalSets: st.setCount,
        settings: {
          marksPerQuestion: st.marksPerQuestion,
          negativeMarking: st.negativeMarks,
        },
      };
      if (actingTeacherUserId) payload.teacherUserId = actingTeacherUserId;

      if (examId) {
        await updateExam(examId, payload);
      } else {
        const res = await createExam(payload);
        if (res.success && res.data) examId = res.data.id;
      }

      toast({
        title: 'Success',
        description: st.status === 'PUBLISHED' ? 'Exam published!' : 'Exam saved as draft.',
        variant: 'success',
      });

      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save exam';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    update({ status: 'DRAFT' });
    await handlePublish();
  };

  // ─── Render ───────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return renderBasics();
      case 1: return renderMethod();
      case 2: return renderSetsGenerate();
      case 3: return renderDownloads();
      case 4: return renderPublish();
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[88vh] bg-white">
      {/* Stepper */}
      <div className="flex items-start overflow-x-auto px-6 py-4 border-b border-slate-100">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col items-center flex-1 min-w-20 relative cursor-pointer',
              i <= maxStep + 1 ? 'cursor-pointer' : 'cursor-default opacity-50',
            )}
            onClick={() => navigateTo(i)}
          >
            {i < STEPS.length - 1 && (
              <div className={cn(
                'absolute top-3.75 left-[calc(50%+17px)] right-[calc(-50%+17px)] h-px z-0',
                i < step ? 'bg-blue-500' : 'bg-slate-200',
              )} />
            )}
            <div className={cn(
              'w-7.5 h-7.5 rounded-full flex items-center justify-center text-[11px] font-medium border z-1 transition-all',
              i === step ? 'bg-blue-500 border-blue-500 text-white' :
              i < step ? 'bg-blue-50 border-blue-500 text-blue-800' :
              'bg-white border-slate-200 text-slate-400',
            )}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <div className={cn(
              'text-[10px] mt-1.5 text-center leading-tight',
              i === step ? 'text-slate-900 font-medium' :
              i < step ? 'text-blue-800' : 'text-slate-400',
            )}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
        <div className="flex gap-2">
          {step > 0 && (
            <button
              className="px-4 py-2 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              onClick={() => navigateTo(step - 1)}
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
          <button
            className="px-4 py-2 text-xs font-medium rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-white transition-colors flex items-center gap-1.5"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            <Save className="h-3 w-3" /> Save draft
          </button>
        </div>

        {step < 4 ? (
          <button
            className="px-5 py-2 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1.5"
            onClick={advance}
          >
            {step === 0 ? 'Next: question method' :
             step === 1 ? 'Next: sets & generate' :
             step === 2 ? 'Next: downloads' :
             'Next: publish'}
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <button
            className="px-5 py-2 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            onClick={handlePublish}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {st.status === 'PUBLISHED' ? 'Publish exam' : 'Save exam'}
          </button>
        )}
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function WizardLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-4 mb-1.5', className)}>
      {children}
    </div>
  );
}

function FieldWrap({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function BadgeRow({ options, value, onChange }: { options: { value: string; label: string; accent?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer',
            value === opt.value
              ? opt.accent === 'amber' ? 'bg-amber-50 border-amber-400 text-amber-800'
              : opt.value === 'PUBLISHED' ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
              : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50',
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 my-1.5">
      <button
        className={cn(
          'w-8 h-4.25 rounded-full relative transition-colors shrink-0',
          checked ? 'bg-blue-500' : 'bg-slate-300',
        )}
        onClick={() => onChange(!checked)}
      >
        <div className={cn(
          'absolute top-0.5 w-3.25 h-3.25 bg-white rounded-full transition-all',
          checked ? 'left-4.25' : 'left-0.5',
        )} />
      </button>
      <span className="text-[13px] text-slate-600">{label}</span>
    </div>
  );
}

function MethodCard({ selected, onClick, icon, iconBg, title, sub, recommended }: {
  selected: boolean; onClick: () => void; icon: ReactNode; iconBg: string;
  title: string; sub: string; recommended?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        selected ? 'border-[1.5px] border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200',
      )}
      onClick={onClick}
    >
      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center mb-2', iconBg)}>
        {icon}
      </div>
      <div className="text-xs font-medium text-slate-900">
        {title}
        {recommended && (
          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded bg-green-100 text-green-800">recommended</span>
        )}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{sub}</div>
    </div>
  );
}

function TypeCard({ dot, title, sub, value, onChange }: {
  dot: string; title: string; sub: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="flex-1">
        <div className="mb-1 h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
        <div className="text-xs font-medium text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-400">{sub}</div>
      </div>
      <Input
        type="number"
        className="h-9 w-14 text-center text-[15px] font-medium"
        min={0}
        max={99}
        value={value}
        onChange={(e) => onChange(Math.max(0, +e.target.value || 0))}
      />
    </div>
  );
}

function MarksInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-50 p-2.5">
      <span className="flex-1 text-[11px] text-slate-500">{label}</span>
      <Input
        type="number"
        className="h-9 w-14 text-center text-sm"
        min={0}
        step={0.25}
        value={value}
        onChange={(e) => onChange(+e.target.value || 0)}
      />
    </div>
  );
}

function SummaryStrip({ st, totalQuestionsPerSet }: { st: WizardState; totalQuestionsPerSet: number }) {
  const totalRows = totalQuestionsPerSet * st.setCount;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 p-3 bg-slate-50 rounded-md text-xs text-slate-500">
      <span><b className="text-slate-700">{st.selectedFolders.size}</b> folders</span>
      <span className="text-slate-300">·</span>
      <span>P-MCQ <b className="text-slate-700">{st.mcqPassageCount}</b></span>
      <span className="text-slate-300">·</span>
      <span>S-MCQ <b className="text-slate-700">{st.mcqSingleCount}</b></span>
      <span className="text-slate-300">·</span>
      <span>CQ <b className="text-slate-700">{st.cqCount}</b></span>
      <span className="text-slate-300">·</span>
      <span>Short <b className="text-slate-700">{st.shortCount}</b></span>
      <span className="text-slate-300">·</span>
      <span><b className="text-slate-700">{totalQuestionsPerSet}</b> Qs/set</span>
      <span className="text-slate-300">·</span>
      <span><b className="text-slate-700">{st.setCount}</b> sets</span>
      <span className="text-slate-300">·</span>
      <span><b className="text-slate-700">{totalRows}</b> total rows</span>
    </div>
  );
}

function subtreeMatchesSearch(node: FolderTreeNode, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  const kids = node.children ?? [];
  return kids.some((c) => subtreeMatchesSearch(c, q));
}

function PoolWarning({ folderTree, selectedFolders, mcqPassageCount, mcqSingleCount, cqCount }: {
  folderTree: FolderTreeNode[]; selectedFolders: Set<string>; mcqPassageCount: number; mcqSingleCount: number; cqCount: number;
}) {
  const aggregated = useMemo(() => {
    let totalP = 0, totalS = 0, totalC = 0;
    function walk(nodes: FolderTreeNode[]) {
      for (const n of nodes) {
        if (selectedFolders.has(n.id)) {
          totalP += n.counts.mcqPassage;
          totalS += n.counts.mcqSingle;
          totalC += n.counts.cq;
        }
        const kids = n.children ?? [];
        if (kids.length) walk(kids);
      }
    }
    walk(folderTree);
    return { totalP, totalS, totalC };
  }, [folderTree, selectedFolders]);

  if (selectedFolders.size === 0) return null;

  const issues: string[] = [];
  if (mcqPassageCount > aggregated.totalP && aggregated.totalP > 0) issues.push(`Only ${aggregated.totalP} passages available (need ${mcqPassageCount})`);
  if (mcqSingleCount > aggregated.totalS && aggregated.totalS > 0) issues.push(`Only ${aggregated.totalS} single MCQs available (need ${mcqSingleCount})`);
  if (cqCount > aggregated.totalC && aggregated.totalC > 0) issues.push(`Only ${aggregated.totalC} CQs available (need ${cqCount})`);

  if (issues.length === 0) return null;

  return (
    <div className="p-3 bg-amber-50 rounded-md text-xs text-amber-800 flex items-start gap-2">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
      <span>Pool warning: {issues.join('; ')}</span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="text-[11px] text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-medium text-slate-900">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: ExamStatus }) {
  return (
    <span className={cn(
      'inline-block px-2 py-0.5 rounded text-[11px] font-medium',
      status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
      status === 'CLOSED' ? 'bg-red-100 text-red-800' :
      'bg-amber-100 text-amber-800',
    )}>
      {status === 'DRAFT' ? 'Draft' : status === 'PUBLISHED' ? 'Published' : 'Closed'}
    </span>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 py-1 text-xs text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        className="w-3.5 h-3.5 accent-blue-500"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function DlButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── Folder Tree Panel ──────────────────────────────────────────────────
function FolderTreePanel({
  tree,
  treeLoading,
  selectedFolders,
  onSelectionChange,
  courseSelected,
}: {
  tree: FolderTreeNode[];
  treeLoading: boolean;
  selectedFolders: Set<string>;
  onSelectionChange: (folders: Set<string>) => void;
  courseSelected: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(new Set());

  const defaultExpandedRootIds = useMemo(() => {
    const s = new Set<string>();
    for (const n of tree) {
      if ((n.children ?? []).length > 0) s.add(n.id);
    }
    return s;
  }, [tree]);

  useEffect(() => {
    setManualExpandedIds(new Set(defaultExpandedRootIds));
  }, [defaultExpandedRootIds]);

  const treeStats = useMemo(() => treeFolderAndQuestionTotals(tree), [tree]);

  const expandAllBranches = useCallback(() => {
    setManualExpandedIds(collectIdsWithChildren(tree));
  }, [tree]);

  const collapseAllBranches = useCallback(() => {
    setManualExpandedIds(new Set());
  }, []);

  // Compute search-expanded IDs via useMemo (no setState in effect)
  const searchExpandedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const result = new Set<string>();
    function walk(nodes: FolderTreeNode[]) {
      for (const n of nodes) {
        const kids = n.children ?? [];
        if (n.name.toLowerCase().includes(q)) result.add(n.id);
        if (kids.length) {
          walk(kids);
          if (kids.some((c) => result.has(c.id))) result.add(n.id);
        }
      }
    }
    walk(tree);
    return result;
  }, [searchQuery, tree]);

  const expandedIds = useMemo(() => {
    const merged = new Set(manualExpandedIds);
    searchExpandedIds.forEach(id => merged.add(id));
    return merged;
  }, [manualExpandedIds, searchExpandedIds]);

  const toggleExpand = useCallback((id: string) => {
    setManualExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    const next = new Set(selectedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }, [selectedFolders, onSelectionChange]);

  const clearSelection = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const selectTopLevelFolders = useCallback(() => {
    const next = new Set<string>();
    const walk = (n: FolderTreeNode) => {
      next.add(n.id);
      (n.children ?? []).forEach(walk);
    };
    tree.forEach(walk);
    onSelectionChange(next);
  }, [tree, onSelectionChange]);

  const selectAll = useCallback((node: FolderTreeNode, checked: boolean) => {
    const next = new Set(selectedFolders);
    function walk(n: FolderTreeNode) {
      if (checked) next.add(n.id);
      else next.delete(n.id);
      (n.children ?? []).forEach(walk);
    }
    walk(node);
    onSelectionChange(next);
  }, [selectedFolders, onSelectionChange]);

  // Collect selected leaf names for tags
  const selectedLeafNames = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    function walk(nodes: FolderTreeNode[]) {
      for (const n of nodes) {
        if (selectedFolders.has(n.id)) {
          result.push({ id: n.id, name: n.name });
          seen.add(n.id);
        }
        const kids = n.children ?? [];
        if (kids.length) walk(kids);
      }
    }
    walk(tree);
    for (const id of selectedFolders) {
      if (!seen.has(id)) {
        result.push({ id, name: 'Folder not in tree' });
        seen.add(id);
      }
    }
    return result;
  }, [tree, selectedFolders]);

  const q = searchQuery.toLowerCase();

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
      {/* Search + expand/collapse */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <Input
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={treeLoading || !tree.length}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-slate-600"
            disabled={treeLoading || !tree.length}
            onClick={selectTopLevelFolders}
          >
            Select roots
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-slate-600"
            disabled={treeLoading || selectedFolders.size === 0}
            onClick={clearSelection}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-slate-600"
            disabled={treeLoading || !tree.length}
            onClick={expandAllBranches}
          >
            Expand all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-slate-600"
            disabled={treeLoading || !tree.length}
            onClick={collapseAllBranches}
          >
            Collapse all
          </Button>
        </div>
      </div>

      {tree.length > 0 && (
        <div className="border-b border-slate-100 bg-white px-3 py-1.5 text-[10px] text-slate-500">
          <span className="font-medium text-slate-600">{treeStats.folders}</span> folders in tree
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="font-medium text-slate-600">{treeStats.questions}</span> questions (all folders)
        </div>
      )}

      {/* Tree */}
      <div className="relative max-h-80 overflow-y-auto">
        {treeLoading && tree.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading folders…
          </div>
        )}
        {treeLoading && tree.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex justify-center bg-white/50 pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        )}
        {!treeLoading && tree.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            {!courseSelected
              ? 'Select a course in step 1, then open this step again to load folders.'
              : !q
                ? 'No question folders found for this course.'
                : 'No matching folders.'}
          </div>
        )}
        {tree.length > 0 && (
          <FolderTreeNodes
            nodes={tree}
            depth={0}
            expandedIds={expandedIds}
            selectedFolders={selectedFolders}
            searchQuery={q}
            toggleExpand={toggleExpand}
            toggleSelect={toggleSelect}
            selectAll={selectAll}
          />
        )}
      </div>

      {/* Selected tags */}
      <div className="flex min-h-10 flex-wrap gap-1 border-t border-slate-100 bg-white px-3 py-2">
        {selectedLeafNames.length === 0 ? (
          <span className="text-[11px] text-slate-400">No folders selected — browse and check above</span>
        ) : (
          <>
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {selectedLeafNames.length} selected
            </span>
            {selectedLeafNames.map(leaf => (
              <div key={leaf.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-[11px] font-medium text-blue-800">
                {leaf.name}
                <button className="text-blue-700 hover:text-blue-900" onClick={() => toggleSelect(leaf.id)}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function FolderTreeNodes({ nodes, depth, expandedIds, selectedFolders, searchQuery, toggleExpand, toggleSelect, selectAll }: {
  nodes: FolderTreeNode[];
  depth: number;
  expandedIds: Set<string>;
  selectedFolders: Set<string>;
  searchQuery: string;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: (node: FolderTreeNode, checked: boolean) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const children = node.children ?? [];
        const isLeaf = children.length === 0;
        const isExpanded = expandedIds.has(node.id);
        const c = node.counts ?? { mcqSingle: 0, mcqPassage: 0, cq: 0, short: 0, total: 0 };
        const leafMcq = (c.mcqSingle ?? 0) + (c.mcqPassage ?? 0);

        // Returns true if this node AND every descendant is in selectedFolders
        function allSubtreeSelected(n: FolderTreeNode): boolean {
          if (!selectedFolders.has(n.id)) return false;
          return (n.children ?? []).every(allSubtreeSelected);
        }
        // Returns true if this node OR any descendant is in selectedFolders
        function anySubtreeSelected(n: FolderTreeNode): boolean {
          if (selectedFolders.has(n.id)) return true;
          return (n.children ?? []).some(anySubtreeSelected);
        }

        if (searchQuery && !subtreeMatchesSearch(node, searchQuery)) return null;

        if (isLeaf) {
          const qn = node.questionCount ?? c.total ?? 0;
          return (
            <div
              key={node.id}
              className="flex items-center gap-1.5 py-1.5 px-2 text-xs text-slate-600 cursor-pointer hover:bg-white"
              style={{ paddingLeft: 12 + depth * 14 }}
              onClick={() => toggleSelect(node.id)}
            >
              <FileText className="h-2.5 w-2.5 text-slate-400 shrink-0" />
              <span className="flex-1 truncate">{node.name}</span>
              <span className="whitespace-nowrap text-[10px] text-slate-400" title="Questions in this folder (by type)">
                {qn}Q · {formatRowCounts(leafMcq, c.cq ?? 0, c.short ?? 0)}
              </span>
              <input
                type="checkbox"
                className="w-3 h-3 accent-blue-500 shrink-0"
                checked={selectedFolders.has(node.id)}
                onChange={() => toggleSelect(node.id)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          );
        }

        // Folder node (not leaf)
        const allSelected = allSubtreeSelected(node);
        const someSelected = anySubtreeSelected(node);
        const agg = subtreeTypeTotals(node);
        const subfolderCount = node.childCount ?? children.length;

        return (
          <div key={node.id}>
            <div
              className="flex cursor-pointer items-center gap-1.5 px-2 py-1.5 text-sm text-slate-900 hover:bg-white"
              style={{ paddingLeft: 6 + depth * 14 }}
              onClick={() => toggleExpand(node.id)}
            >
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
              >
                <ChevronRight className={cn('h-2.5 w-2.5 transition-transform', isExpanded && 'rotate-90')} />
              </button>
              <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="flex-1 truncate text-[13px]">{node.name}</span>
              <span
                className="max-w-[min(52vw,14rem)] truncate whitespace-nowrap text-right text-[10px] text-slate-400"
                title="Subfolders · subtree question total · MCQ / CQ / Short in subtree"
              >
                {subfolderCount > 0
                  ? `${subfolderCount} subfolder${subfolderCount === 1 ? '' : 's'} · `
                  : ''}
                Σ{agg.questions}Q · {formatRowCounts(agg.mcq, agg.cq, agg.short)}
              </span>
              <input
                type="checkbox"
                className="h-3 w-3 shrink-0 accent-blue-500"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => selectAll(node, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {isExpanded && (
              <FolderTreeNodes
                nodes={children}
                depth={depth + 1}
                expandedIds={expandedIds}
                selectedFolders={selectedFolders}
                searchQuery={searchQuery}
                toggleExpand={toggleExpand}
                toggleSelect={toggleSelect}
                selectAll={selectAll}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
