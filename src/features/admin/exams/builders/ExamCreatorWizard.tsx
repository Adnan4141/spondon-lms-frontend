'use client';

import { useState, useEffect, useCallback, useMemo, useReducer, type ReactNode } from 'react';
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
  listBlueprintPresets,
  type ExamBlueprintPreset,
  type ExamBlueprint,
} from '@/lib/api/exams';
// getQuestionFolderTree + FolderTreeNode removed — now inside ExamSectionBuilder
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type {
  CreateExamDto,
  Exam,
  ExamEngineType,
  ExamSet,
  ExamType,
  ExamMode,
  ExamStatus,
  ExamScope,
} from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Folder,
  FileText,
  Download,
  Send,
  Save,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Loader2,
  ChevronsUpDown,
  BookOpen,
  Layers,
  Info,
  BookMarked,
  Plus,
  Pencil,
  Trash2,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExamSubjectBuilder } from './ExamSubjectBuilder';
import { TalentHuntBuilder } from './TalentHuntBuilder';
import { ExamSectionBuilder } from '../components/ExamSectionBuilder';

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
  scope: ExamScope;
  examEngine: ExamEngineType;
  sectionNavigation: 'SEQUENTIAL' | 'FREE';
  startAt: string;
  endAt: string;
  durationMinutes: number;
  allowedAttempts: number;
  showLeaderboard: boolean;
  showPercentile: boolean;
  solveSheetVisibility: 'HIDDEN' | 'AFTER_SUBMISSION' | 'IMMEDIATELY';
  omrQuestionCount: number;
  omrOptionCount: number;
  // Step 2 - Method
  method: 'folder' | 'blueprint' | 'manual' | 'import';
  selectedBlueprintId: string | null;
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

type WizardAction = { type: 'PATCH'; payload: Partial<WizardState> } | { type: 'RESTORE'; payload: WizardState };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload };
    case 'RESTORE':
      return action.payload;
    default:
      return state;
  }
}

// Serialize/deserialize — Sets must be converted to/from arrays
function serializeState(st: WizardState): string {
  return JSON.stringify({ ...st, selectedFolders: Array.from(st.selectedFolders) });
}
function deserializeState(raw: string): WizardState | null {
  try {
    const obj = JSON.parse(raw);
    return { ...obj, selectedFolders: new Set<string>(obj.selectedFolders ?? []) };
  } catch {
    return null;
  }
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
  const ids: string[] = [];
  for (const sub of subjects) {
    for (const rule of sub.folderRules ?? []) {
      if (rule.folderId) ids.push(rule.folderId);
    }
  }
  return new Set(ids);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ExamCreatorWizard({ exam, onSuccess, onClose, actingTeacherUserId }: ExamCreatorWizardProps) {
  const { toast } = useToast();

  const draftKey = `exam-wizard-draft-${exam?.id ?? 'new'}`;

  // ── Initial state builder ────────────────────────────────────────────────
  const buildInitialState = useCallback((): WizardState => ({
    title: exam?.title || '',
    courseId: exam?.courseId || '',
    branchId: exam?.branchId || '',
    batchId: exam?.batchId || '',
    language: exam?.language || 'bn',
    type: exam?.type || 'PRACTICE',
    mode: exam?.mode || 'ONLINE',
    scope: (exam?.scope as ExamScope) || 'COURSE',
    examEngine: exam?.examEngine || 'REGULAR',
    sectionNavigation: (exam?.settings?.sectionNavigation as 'SEQUENTIAL' | 'FREE') || 'SEQUENTIAL',
    startAt: exam?.startAt ? new Date(exam.startAt).toISOString().slice(0, 16) : '',
    endAt: exam?.endAt ? new Date(exam.endAt).toISOString().slice(0, 16) : '',
    durationMinutes: exam?.durationMinutes || 25,
    allowedAttempts: exam?.allowedAttempts || 1,
    showLeaderboard: exam?.showLeaderboard ?? true,
    showPercentile: exam?.showPercentile ?? true,
    solveSheetVisibility:
      (exam?.solveSheetVisibility as 'HIDDEN' | 'AFTER_SUBMISSION' | 'IMMEDIATELY') || 'HIDDEN',
    omrQuestionCount: (exam?.omrQuestionCount as number) || 100,
    omrOptionCount: (exam?.omrOptionCount as number) || 4,
    method: 'folder',
    selectedBlueprintId: null,
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
  }), [exam]);

  const [st, dispatch] = useReducer(wizardReducer, undefined, buildInitialState);
  const update = useCallback((payload: Partial<WizardState>) => dispatch({ type: 'PATCH', payload }), []);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, serializeState(st));
    } catch { /* ignore quota errors */ }
  }, [st, draftKey]);

  // ── Navigation state ─────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  // ── Draft restore banner ─────────────────────────────────────────────────
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // Only prompt for new exams (not editing existing)
    if (exam) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = deserializeState(raw);
      if (parsed?.title || parsed?.courseId) {
        setShowDraftBanner(true);
        // Try to recover timestamp from a separate key
        const ts = localStorage.getItem(`${draftKey}-ts`);
        setDraftTimestamp(ts);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Save timestamp alongside draft
  useEffect(() => {
    if (!exam) {
      try {
        localStorage.setItem(`${draftKey}-ts`, new Date().toLocaleString());
      } catch { /* ignore */ }
    }
  }, [st, draftKey, exam]);

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = deserializeState(raw);
      if (parsed) {
        dispatch({ type: 'RESTORE', payload: parsed });
        toast({ title: 'Draft restored', variant: 'success' });
      }
    } catch { /* ignore */ }
    setShowDraftBanner(false);
  };

  const handleDismissDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`${draftKey}-ts`);
    } catch { /* ignore */ }
    setShowDraftBanner(false);
  };

  // ── Data loading ─────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseComboOpen, setCourseComboOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [blueprints, setBlueprints] = useState<ExamBlueprintPreset[]>([]);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(exam || null);
  const [generating, setGenerating] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  // Section state is now owned by ExamSectionBuilder (shared component).

  const sortedSets = useMemo(() => sortExamSets(generatedExam?.sets), [generatedExam?.sets]);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, bRes] = await Promise.all([getCourses({ status: 'ACTIVE', limit: 500 }), getBranches()]);
        if (cRes.success && cRes.data) setCourses(cRes.data);
        if (bRes.success && bRes.data) setBranches(bRes.data);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!st.courseId) { setBatches([]); return; }
    (async () => {
      try {
        const res = await getBatches({ courseId: st.courseId, limit: 100 });
        if (res.success && res.data) setBatches(res.data.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
      } catch { /* ignore */ }
    })();
  }, [st.courseId]);

  // Load blueprints when entering step 2 (Method)
  useEffect(() => {
    if (step !== 1 || !st.courseId) return;
    let cancelled = false;
    setBlueprintsLoading(true);
    listBlueprintPresets(st.courseId)
      .then((r) => {
        if (cancelled) return;
        if (r.success && r.data) setBlueprints(r.data);
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (!cancelled) setBlueprintsLoading(false); });
    return () => { cancelled = true; };
  }, [step, st.courseId]);

  // Auto-select blueprint method for MULTI_SUBJECT / UNIVERSITY_SPECIAL
  useEffect(() => {
    if (step === 1 && (st.examEngine === 'MULTI_SUBJECT' || st.examEngine === 'UNIVERSITY_SPECIAL')) {
      update({ method: 'blueprint' });
    }
  }, [step, st.examEngine, update]);

  // Section state + folder tree loading is handled inside ExamSectionBuilder (shared component).

  // ── Navigation ───────────────────────────────────────────────────────────
  const navigateTo = useCallback((s: number) => {
    if (s <= maxStep + 1 && s >= 0 && s < STEPS.length) {
      setStep(s);
      setMaxStep(prev => Math.max(prev, s));
    }
  }, [maxStep]);

  const basicsComplete = Boolean(st.courseId?.trim() && st.title.trim());

  const advance = useCallback(() => {
    if (step === 0 && !basicsComplete) {
      toast({
        title: !st.courseId?.trim() ? 'Course required' : 'Title required',
        description: !st.courseId?.trim() ? 'Choose a course before continuing.' : 'Enter an exam title before continuing.',
        variant: 'destructive',
      });
      return;
    }
    navigateTo(step + 1);
  }, [step, navigateTo, basicsComplete, st.courseId, st.title, toast]);

  const totalQuestionsPerSet = st.mcqPassageCount + st.mcqSingleCount + st.cqCount + st.shortCount;

  // Accurate question count from generated exam sets
  const actualQuestionsPerSet = useMemo(() => {
    if (!generatedExam?.sets?.length) return totalQuestionsPerSet;
    const firstSet = sortedSets[0];
    if (!firstSet) return totalQuestionsPerSet;
    return (firstSet as any).questions?.length ?? (firstSet as any)._count?.questions ?? totalQuestionsPerSet;
  }, [generatedExam, sortedSets, totalQuestionsPerSet]);

  // ── Step 1: Basics ───────────────────────────────────────────────────────
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
        <FieldWrap label="Course *">
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
                      <Input placeholder="Search courses…" className="h-8 pl-8 text-sm" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    <button type="button" onClick={() => { update({ courseId: '', batchId: '' }); setCourseComboOpen(false); }} className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted">— None —</button>
                    {filteredCourses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { update({ courseId: c.id, batchId: '' }); setCourseComboOpen(false); setCourseSearch(''); }}
                        className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted', st.courseId === c.id && 'bg-primary/10 font-medium')}
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{c.name}</span>
                        {st.courseId === c.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                    {filteredCourses.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No courses found</p>}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })()}
        </FieldWrap>
        <FieldWrap label="Branch">
          <Select value={st.branchId || '__all__'} onValueChange={(v) => update({ branchId: v === '__all__' ? '' : v })}>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="All branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All branches —</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
        <FieldWrap label="Batch">
          <Select value={st.batchId || '__none__'} onValueChange={(v) => update({ batchId: v === '__none__' ? '' : v })} disabled={!st.courseId}>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldWrap>
        <FieldWrap label="Language">
          <Select value={st.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
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

      <WizardLabel>Scope</WizardLabel>
      <BadgeRow
        options={[
          { value: 'COURSE', label: 'Course-scoped' },
          { value: 'GLOBAL', label: 'Global (all courses)' },
        ]}
        value={st.scope}
        onChange={(v) => update({ scope: v as ExamScope })}
      />

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
        <FieldWrap label="Start">
          <DateTimePicker date={parseLocalDatetimeInput(st.startAt)} setDate={(d) => update({ startAt: d ? toLocalDatetimeInput(d) : '' })} placeholder="Start date & time" className="h-9 w-full rounded-md border-slate-200 bg-white text-sm font-normal shadow-sm" />
        </FieldWrap>
        <FieldWrap label="End">
          <DateTimePicker date={parseLocalDatetimeInput(st.endAt)} setDate={(d) => update({ endAt: d ? toLocalDatetimeInput(d) : '' })} placeholder="End date & time" className="h-9 w-full rounded-md border-slate-200 bg-white text-sm font-normal shadow-sm" />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-3">
        <FieldWrap label="Duration (min)">
          <Input type="number" min={5} value={st.durationMinutes} onChange={(e) => update({ durationMinutes: +e.target.value || 5 })} className="text-sm" />
        </FieldWrap>
        <FieldWrap label="Attempts">
          <Input type="number" min={1} value={st.allowedAttempts} onChange={(e) => update({ allowedAttempts: +e.target.value || 1 })} className="text-sm" />
        </FieldWrap>
        <FieldWrap label="Engine">
          <Select value={st.examEngine} onValueChange={(v) => update({ examEngine: v as ExamEngineType })}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
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

      {/* Engine guidance cards */}
      {st.examEngine === 'OMR_BOOK' && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium text-amber-800">OMR Mode</p>
          <p className="text-xs text-amber-700 mt-1">Students answer on physical OMR sheets. Upload scanned sheets in the OMR tab after creating the exam.</p>
        </div>
      )}
      {st.examEngine === 'MULTI_SUBJECT' && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-medium text-blue-800">Multi-Subject Exam</p>
          <p className="text-xs text-blue-700 mt-1">Configure subjects with individual folder rules and marks in Step 3. Supports Bangla/English and mixed MCQ+CQ papers.</p>
        </div>
      )}
      {st.examEngine === 'UNIVERSITY_SPECIAL' && (
        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-xs font-medium text-violet-800">University Special</p>
          <p className="text-xs text-violet-700 mt-1">Designed for admission-style exams with mixed MCQ + Written (CQ) sections and separate scoring per subject.</p>
        </div>
      )}

      {/* OMR-specific fields */}
      {st.examEngine === 'OMR_BOOK' && (
        <>
          <WizardLabel>OMR sheet layout</WizardLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Questions per sheet">
              <Input type="number" min={1} max={500} value={st.omrQuestionCount} onChange={(e) => update({ omrQuestionCount: +e.target.value || 100 })} className="text-sm" />
            </FieldWrap>
            <FieldWrap label="Options per question">
              <Input type="number" min={2} max={10} value={st.omrOptionCount} onChange={(e) => update({ omrOptionCount: +e.target.value || 4 })} className="text-sm" />
            </FieldWrap>
          </div>
        </>
      )}

      {/* Section navigation — only for multi-section engines */}
      {(st.examEngine === 'MULTI_SUBJECT' || st.examEngine === 'UNIVERSITY_SPECIAL') && (
        <>
          <WizardLabel>Section navigation</WizardLabel>
          <BadgeRow
            options={[
              { value: 'SEQUENTIAL', label: 'Sequential (locked order)' },
              { value: 'FREE', label: 'Free (any order)' },
            ]}
            value={st.sectionNavigation}
            onChange={(v) => update({ sectionNavigation: v as 'SEQUENTIAL' | 'FREE' })}
          />
        </>
      )}

      <WizardLabel>Options</WizardLabel>
      <Toggle label="Leaderboard" checked={st.showLeaderboard} onChange={(v) => update({ showLeaderboard: v })} />
      <Toggle label="Percentile display" checked={st.showPercentile} onChange={(v) => update({ showPercentile: v })} />

      <WizardLabel>Solve sheet visibility</WizardLabel>
      <BadgeRow
        options={[
          { value: 'HIDDEN', label: 'Hidden' },
          { value: 'AFTER_SUBMISSION', label: 'After submission' },
          { value: 'IMMEDIATELY', label: 'Immediately' },
        ]}
        value={st.solveSheetVisibility}
        onChange={(v) => update({ solveSheetVisibility: v as 'HIDDEN' | 'AFTER_SUBMISSION' | 'IMMEDIATELY' })}
      />
    </>
  );

  // ── Step 2: Method ───────────────────────────────────────────────────────
  const renderMethod = () => {
    const isMultiSubjectEngine = st.examEngine === 'MULTI_SUBJECT' || st.examEngine === 'UNIVERSITY_SPECIAL';
    const selectedPreset = blueprints.find(b => b.id === st.selectedBlueprintId);

    return (
      <>
        <div className="text-[15px] font-medium text-slate-900">Question fill method</div>
        <div className="text-xs text-slate-400 mb-4">
          {isMultiSubjectEngine
            ? 'Multi-subject / University exams use the blueprint method to define subject-level rules.'
            : 'Choose how the paper gets populated.'}
        </div>

        {isMultiSubjectEngine ? (
          // Only show blueprint card for multi-subject engines
          <div className="grid grid-cols-1 gap-3">
            <MethodCard
              selected
              onClick={() => { /* locked */ }}
              icon={<BookMarked className="h-4 w-4 text-violet-700" />}
              iconBg="bg-violet-50"
              title="Blueprint / multi-subject"
              sub="Subject-level plan validated against bank counts before generating."
              recommended
            />
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">Multi-subject and University Special exams always use blueprint-driven generation. Configure subjects in Step 3 after saving the exam basics.</p>
            </div>
          </div>
        ) : (
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
              onClick={() => update({ method: 'blueprint', selectedBlueprintId: blueprints[0]?.id ?? null })}
              icon={<BookMarked className="h-4 w-4 text-violet-700" />}
              iconBg="bg-violet-50"
              title="Blueprint preset"
              sub={blueprints.length > 0 ? `${blueprints.length} preset(s) available for this course.` : 'No presets saved for this course yet.'}
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
              sub="Copy ExamQuestion links from a previous set."
            />
          </div>
        )}

        {/* Blueprint selector + preview */}
        {st.method === 'blueprint' && !isMultiSubjectEngine && (
          <div className="mt-4 space-y-3">
            {blueprintsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading blueprints…</div>
            ) : blueprints.length === 0 ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">No blueprint presets saved for this course. Go to an existing exam's Blueprints tab to save one, or use Folder random instead.</p>
              </div>
            ) : (
              <>
                <WizardLabel className="mt-2">Select a blueprint</WizardLabel>
                <div className="space-y-2">
                  {blueprints.map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => update({ selectedBlueprintId: bp.id })}
                      className={cn(
                        'w-full rounded-lg border px-4 py-3 text-left transition-all',
                        st.selectedBlueprintId === bp.id
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-900 flex-1 truncate">{bp.name}</span>
                        {bp.isDefault && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">default</span>}
                        {st.selectedBlueprintId === bp.id && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
                      </div>
                      {bp.description && <p className="text-xs text-slate-400 mt-1 truncate">{bp.description}</p>}
                      <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400">
                        {(bp.structure as ExamBlueprint)?.sections?.length > 0 && (
                          <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />{(bp.structure as ExamBlueprint).sections.length} section(s)</span>
                        )}
                        {bp.totalMarks && <span>{bp.totalMarks} marks</span>}
                        {bp.duration && <span>{bp.duration} min</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Blueprint structure preview */}
                {selectedPreset && (bp => {
                  const sections = (bp.structure as ExamBlueprint)?.sections ?? [];
                  if (!sections.length) return null;
                  return (
                    <div className="rounded-lg border border-violet-100 bg-white overflow-hidden">
                      <div className="border-b border-violet-100 bg-violet-50 px-3 py-2">
                        <p className="text-[11px] font-semibold text-violet-800">Blueprint structure — {bp.name}</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {sections.map((sec, i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', sec.type === 'MCQ' ? 'bg-sky-50 text-sky-700 border-sky-200' : sec.type === 'CQ' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}>
                              {sec.type}
                            </span>
                            <span className="text-xs font-medium text-slate-700 flex-1 truncate">{sec.name}</span>
                            <span className="text-xs text-slate-400 tabular-nums">{sec.questionCount}q · {(sec.questionCount * sec.marksPerQuestion).toFixed(0)}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })(selectedPreset)}
              </>
            )}
          </div>
        )}
      </>
    );
  };

  // Section CRUD + generation is handled inside ExamSectionBuilder (shared component).

  // ── Step 3: Sets & Generate ──────────────────────────────────────────────
  const renderSetsGenerate = () => {
    const currentExamId = generatedExam?.id ?? (exam?.id ?? null);

    // Multi-subject and University Special → ExamSubjectBuilder
    if (st.examEngine === 'MULTI_SUBJECT' || st.examEngine === 'UNIVERSITY_SPECIAL') {
      if (!currentExamId) {
        return (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-slate-500">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <span>Save the exam basics first to enable multi-subject configuration.</span>
            <button
              className="px-4 py-2 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleSaveDraft}
              disabled={loading || !basicsComplete}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 inline animate-spin mr-1" /> : null}
              Save basics & continue
            </button>
          </div>
        );
      }
      return (
        <>
          <div className="text-[15px] font-medium text-slate-900">
            {st.examEngine === 'UNIVERSITY_SPECIAL' ? 'University Special configuration' : 'Multi-subject configuration'}
          </div>
          <div className="text-xs text-slate-400 mb-4">Add subjects, configure per-type question counts and folder rules, then generate the paper.</div>
          <ExamSubjectBuilder examId={currentExamId} onGenerated={() => { onSuccess(); }} />
        </>
      );
    }

    // Talent Hunt
    if (st.examEngine === 'TALENT_HUNT') {
      if (!currentExamId) {
        return (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-slate-500">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <span>Save the exam basics first to configure the talent hunt.</span>
            <button
              className="px-4 py-2 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleSaveDraft}
              disabled={loading || !basicsComplete}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 inline animate-spin mr-1" /> : null}
              Save basics & continue
            </button>
          </div>
        );
      }
      return (
        <>
          <div className="text-[15px] font-medium text-slate-900">Talent Hunt configuration</div>
          <div className="text-xs text-slate-400 mb-4">Configure stages, prizes, and registration settings.</div>
          <TalentHuntBuilder examId={currentExamId} onSaved={() => onSuccess()} />
        </>
      );
    }

    // Default: REGULAR / COMPETITIVE / OMR_BOOK — Section-first builder
    // Must save basics first to get an examId
    if (!currentExamId) {
      return (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Layers className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900 mb-1">Save basics first</div>
            <div className="text-xs text-slate-500">We need an exam ID before you can create sections and generate question sets.</div>
          </div>
          <button
            className="px-5 py-2.5 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            onClick={handleSaveDraft}
            disabled={loading || !basicsComplete}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save basics & continue
          </button>
        </div>
      );
    }

    // Shared ExamSectionBuilder — same component used in /admin/exams/[id] Sections tab
    return (
      <ExamSectionBuilder
        examId={currentExamId}
        courseId={st.courseId}
        setCount={st.setCount}
        onSetCountChange={v => update({ setCount: v })}
        actingTeacherUserId={actingTeacherUserId || undefined}
        onGenerated={async () => {
          const refreshed = await getExamById(currentExamId, { teacherUserId: actingTeacherUserId ?? undefined });
          if (refreshed.success && refreshed.data) setGeneratedExam(refreshed.data);
        }}
      />
    );
  };

  // ── Step 4: Downloads ────────────────────────────────────────────────────
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
        <div className="text-xs text-slate-400 mb-4">Download each set for offline distribution or preview in browser.</div>

        {!generatedExam?.id && (
          <div className="mb-4 rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
            Save and generate questions first (step 3), then return here to download PDFs.
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <DlButton onClick={() => handleBulkDownload()} disabled={!generatedExam?.id || pdfBusy === 'bulk-pdf'}>
            {pdfBusy === 'bulk-pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            All sets — PDF
          </DlButton>
          <DlButton onClick={() => toast({ title: 'DOCX export', description: 'Combined DOCX export is not available yet.' })} disabled={!generatedExam?.id}>
            All sets — DOCX
          </DlButton>
          <DlButton onClick={() => handleSolveSheet()} disabled={!generatedExam?.id || pdfBusy === 'solve'}>
            {pdfBusy === 'solve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Solve sheet
          </DlButton>
          <DlButton onClick={() => toast({ title: 'OMR', description: 'OMR template generation coming soon.' })}>OMR template</DlButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {setsForCards.map((setRow, i) => {
            const label = setRow.name;
            const co = SET_COLORS[i % SET_COLORS.length];
            const setId = setRow.id || null;
            const busy = setId ? pdfBusy === `set-${setId}` : false;
            const canPdf = Boolean(generatedExam?.id && setId);
            const qCount = (setRow as any).questions?.length ?? (setRow as any)._count?.questions ?? actualQuestionsPerSet;
            return (
              <div key={setId || `placeholder-${label}`} className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-medium" style={{ background: co.bg, color: co.color }}>
                    {label}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">Set {label}</div>
                    <div className="text-[10px] text-slate-400">{qCount} Qs · {st.shuffle ? 'shuffled' : 'ordered'}</div>
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
                  <button type="button" className="flex-1 rounded-md border border-slate-200 bg-slate-50 py-1 text-[10px] font-medium text-slate-500 hover:bg-white disabled:opacity-50" disabled>DOCX</button>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-slate-200 bg-slate-50 py-1 text-[10px] font-medium text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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

  // ── Step 5: Publish ──────────────────────────────────────────────────────
  const renderPublish = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Publish exam</div>
      <div className="text-xs text-slate-400 mb-4">Review everything and go live. Status can be changed anytime.</div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Status" value={<StatusBadge status={st.status} />} />
        <StatCard label="Sets generated" value={sortedSets.length || st.setCount} sub={Array.from({ length: sortedSets.length || st.setCount }, (_, i) => setLabel(i)).join(' · ')} />
        <StatCard label="Questions / set" value={actualQuestionsPerSet} sub={`${st.mcqPassageCount}P · ${st.mcqSingleCount}S-MCQ · ${st.cqCount}CQ · ${st.shortCount}Short`} />
        <StatCard label="Folders used" value={st.selectedFolders.size} sub="source folders selected" />
        <StatCard label="Engine" value={st.examEngine.replace(/_/g, ' ')} />
        <StatCard label="Mode" value={st.mode} />
        <StatCard label="Scope" value={st.scope} />
        <StatCard label="Duration" value={st.durationMinutes ? `${st.durationMinutes} min` : '—'} />
        {st.startAt && <StatCard label="Start" value={new Date(st.startAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })} />}
        {st.endAt && <StatCard label="End" value={new Date(st.endAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })} />}
      </div>

      <WizardLabel>Publish action</WizardLabel>
      <BadgeRow
        options={[
          { value: 'DRAFT', label: 'Keep draft' },
          { value: 'PUBLISHED', label: 'Publish now' },
          { value: 'CLOSED', label: 'Closed' },
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
        <div className="mt-2 text-[10px] text-slate-400">Note: Notification delivery is not yet implemented — selections are saved for future use.</div>

        <div className="mt-3 p-2 bg-white rounded-md border border-slate-100 text-[11px] text-slate-400">
          Recipients: <b className="text-slate-600">enrolled students</b> — {branches.find(b => b.id === st.branchId)?.name || 'All branches'}
        </div>
      </div>
    </>
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const buildExamPayload = (status: ExamStatus): CreateExamDto => {
    const payload: CreateExamDto = {
      title: st.title.trim(),
      courseId: st.courseId.trim(),
      branchId: st.branchId?.trim() || '',
      batchId: st.batchId?.trim() || undefined,
      type: st.type,
      mode: st.mode,
      scope: st.scope,
      examEngine: st.examEngine,
      startAt: st.startAt || undefined,
      endAt: st.endAt || undefined,
      durationMinutes: st.durationMinutes || undefined,
      allowedAttempts: st.allowedAttempts,
      status,
      showLeaderboard: st.showLeaderboard,
      showPercentile: st.showPercentile,
      solveSheetVisibility: st.solveSheetVisibility,
      language: st.language,
      totalSets: st.setCount,
      omrQuestionCount: st.examEngine === 'OMR_BOOK' ? st.omrQuestionCount : undefined,
      omrOptionCount: st.examEngine === 'OMR_BOOK' ? st.omrOptionCount : undefined,
      settings: {
        marksPerQuestion: st.marksPerQuestion,
        negativeMarking: st.negativeMarks,
        sectionNavigation: st.sectionNavigation,
        ...(st.selectedBlueprintId ? { blueprintId: st.selectedBlueprintId } : {}),
      },
    };
    if (actingTeacherUserId) payload.teacherUserId = actingTeacherUserId;
    return payload;
  };

  // handleGenerate (old global set generation) removed — ExamSectionBuilder now owns all generation.

  const openPdfUrl = (url: string) => {
    const href = getExamPdfDownloadUrl(url);
    if (!href) { toast({ title: 'Error', description: 'Missing PDF URL', variant: 'destructive' }); return; }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleBulkDownload = async () => {
    if (!generatedExam?.id) return;
    try {
      setPdfBusy('bulk-pdf');
      const res = await regenerateExamPdf(generatedExam.id, 2);
      if (!res.success || !res.data?.pdfUrl) { toast({ title: 'Could not generate PDF', description: res.message || 'Ensure sets have questions.', variant: 'destructive' }); return; }
      openPdfUrl(res.data.pdfUrl);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to generate PDF', variant: 'destructive' });
    } finally { setPdfBusy(null); }
  };

  const handleSolveSheet = async () => {
    if (!generatedExam?.id) return;
    try {
      setPdfBusy('solve');
      const res = await regenerateSolveSheet(generatedExam.id);
      if (!res.success || !res.data?.solveSheetUrl) { toast({ title: 'Could not generate solve sheet', description: res.message || 'Try again after questions are added.', variant: 'destructive' }); return; }
      openPdfUrl(res.data.solveSheetUrl);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to generate solve sheet', variant: 'destructive' });
    } finally { setPdfBusy(null); }
  };

  const handleSetPdf = async (setName: string, setId: string) => {
    if (!generatedExam?.id || !setId) return;
    try {
      setPdfBusy(`set-${setId}`);
      const res = await generateSetPdf(generatedExam.id, setId, 2);
      if (!res.success || !res.data?.pdfUrl) { toast({ title: `Set ${setName}`, description: res.message || 'Could not generate PDF.', variant: 'destructive' }); return; }
      openPdfUrl(res.data.pdfUrl);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : `Failed to generate PDF for Set ${setName}`, variant: 'destructive' });
    } finally { setPdfBusy(null); }
  };

  const handlePublish = async () => {
    if (!st.courseId?.trim() || !st.title.trim()) {
      toast({ title: 'Missing basics', description: 'Select a course and enter a title (step 1) before saving.', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      let examId = generatedExam?.id;
      const payload = buildExamPayload(st.status);

      if (examId) {
        await updateExam(examId, payload);
      } else {
        const res = await createExam(payload);
        if (res.success && res.data) {
          examId = res.data.id;
          setGeneratedExam(res.data);
        }
      }

      // Clean up draft
      try { localStorage.removeItem(draftKey); localStorage.removeItem(`${draftKey}-ts`); } catch { /* ignore */ }

      toast({ title: 'Success', description: st.status === 'PUBLISHED' ? 'Exam published!' : 'Exam saved as draft.', variant: 'success' });
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save exam', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    update({ status: 'DRAFT' });
    if (!st.courseId?.trim() || !st.title.trim()) {
      toast({ title: 'Missing basics', description: 'Select a course and enter a title before saving.', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      let examId = generatedExam?.id;
      const payload = buildExamPayload('DRAFT');
      if (examId) {
        await updateExam(examId, payload);
      } else {
        const res = await createExam(payload);
        if (res.success && res.data) {
          examId = res.data.id;
          setGeneratedExam(res.data);
        }
      }
      toast({ title: 'Draft saved', description: 'Exam saved as draft.', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save draft', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
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
              'flex flex-col items-center flex-1 min-w-20 relative',
              i <= maxStep + 1 ? 'cursor-pointer' : 'cursor-default opacity-50',
            )}
            onClick={() => navigateTo(i)}
          >
            {i < STEPS.length - 1 && (
              <div className={cn('absolute top-3.75 left-[calc(50%+17px)] right-[calc(-50%+17px)] h-px z-0', i < step ? 'bg-blue-500' : 'bg-slate-200')} />
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

      {/* Draft restore banner */}
      {showDraftBanner && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="flex-1 text-amber-800">
            Unsaved draft found{draftTimestamp ? ` from ${draftTimestamp}` : ''}. Restore it?
          </span>
          <button
            type="button"
            onClick={handleRestoreDraft}
            className="font-medium text-amber-900 underline hover:no-underline"
          >
            Restore
          </button>
          <button type="button" onClick={handleDismissDraft} className="text-amber-600 hover:text-amber-900">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save draft
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

// ─── Sub-components ──────────────────────────────────────────────────────────

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
        className={cn('w-8 h-4.25 rounded-full relative transition-colors shrink-0', checked ? 'bg-blue-500' : 'bg-slate-300')}
        onClick={() => onChange(!checked)}
      >
        <div className={cn('absolute top-0.5 w-3.25 h-3.25 bg-white rounded-full transition-all', checked ? 'left-4.25' : 'left-0.5')} />
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
      className={cn('p-4 rounded-lg border cursor-pointer transition-all', selected ? 'border-[1.5px] border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200')}
      onClick={onClick}
    >
      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center mb-2', iconBg)}>
        {icon}
      </div>
      <div className="text-xs font-medium text-slate-900">
        {title}
        {recommended && <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded bg-green-100 text-green-800">recommended</span>}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{sub}</div>
    </div>
  );
}

// ─── Inline helpers (still used in Downloads + Publish steps) ────────────────

function DlButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
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

function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: ExamStatus }) {
  const cfg =
    status === 'PUBLISHED' ? { label: 'Published', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' } :
    status === 'CLOSED' ? { label: 'Closed', cls: 'bg-rose-100 text-rose-800 border-rose-200' } :
    { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-md border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
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
