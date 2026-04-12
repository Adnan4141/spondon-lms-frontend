'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { createExam, updateExam, addQuestionsToSet, regenerateExamPdf, regenerateSolveSheet, generateSetPdf, getExamPdfDownloadUrl, getExamById } from '@/lib/api/exams';
import { getQuestionFolderTree, type FolderTreeNode } from '@/lib/api/question-bank';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { CreateExamDto, Exam, ExamType, ExamMode, ExamStatus } from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronRight, Search, X, Folder, FileText, Download, Send, Save, ArrowLeft, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

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

// ─── Main Component ─────────────────────────────────────────────────────────
export function ExamCreatorWizard({ exam, onSuccess, onClose, actingTeacherUserId }: ExamCreatorWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(exam || null);
  const [generating, setGenerating] = useState(false);


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
    method: 'folder',
    selectedFolders: new Set<string>(),
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

  // Load folder tree when entering step 3
  useEffect(() => {
    if (step === 2) {
      (async () => {
        try {
          const res = await getQuestionFolderTree(st.courseId || undefined, actingTeacherUserId || undefined);
          if (res.success && res.data) setFolderTree(res.data);
        } catch { /* ignore */ }
      })();
    }
  }, [step, st.courseId, actingTeacherUserId]);

  const navigateTo = useCallback((s: number) => {
    if (s <= maxStep + 1 && s >= 0 && s < STEPS.length) {
      setStep(s);
      setMaxStep(prev => Math.max(prev, s));
    }
  }, [maxStep]);

  const advance = useCallback(() => {
    navigateTo(step + 1);
  }, [step, navigateTo]);

  const totalQuestionsPerSet = st.mcqPassageCount + st.mcqSingleCount + st.cqCount + st.shortCount;

  // ─── Step 1: Basics ─────────────────────────────────────────────────────
  const renderBasics = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Exam basics</div>
      <div className="text-xs text-slate-400 mb-4">Define exam identity and scheduling.</div>

      <Label>Exam title</Label>
      <input
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        placeholder="e.g. VAP Bio-01 Weekly MCQ 2025"
        value={st.title}
        onChange={e => update({ title: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3 mt-3">
        <FieldWrap label="Course">
          <select className="wizard-select" value={st.courseId} onChange={e => update({ courseId: e.target.value, batchId: '' })}>
            <option value="">— Select —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Branch">
          <select className="wizard-select" value={st.branchId} onChange={e => update({ branchId: e.target.value })}>
            <option value="">— All branches —</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FieldWrap>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <FieldWrap label="Batch">
          <select className="wizard-select" value={st.batchId} onChange={e => update({ batchId: e.target.value })}>
            <option value="">—</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Language">
          <select className="wizard-select" value={st.language} onChange={e => update({ language: e.target.value })}>
            <option value="bn">Bengali</option>
            <option value="en">English</option>
          </select>
        </FieldWrap>
      </div>

      <Label>Exam type</Label>
      <BadgeRow
        options={EXAM_TYPES}
        value={st.type}
        onChange={v => update({ type: v as ExamType })}
      />

      <Label>Mode</Label>
      <BadgeRow
        options={EXAM_MODES}
        value={st.mode}
        onChange={v => update({ mode: v as ExamMode })}
      />

      <div className="grid grid-cols-2 gap-3 mt-3">
        <FieldWrap label="Start">
          <input type="datetime-local" className="wizard-select" value={st.startAt} onChange={e => update({ startAt: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="End">
          <input type="datetime-local" className="wizard-select" value={st.endAt} onChange={e => update({ endAt: e.target.value })} />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <FieldWrap label="Duration (min)">
          <input type="number" className="wizard-select" min={5} value={st.durationMinutes} onChange={e => update({ durationMinutes: +e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Attempts">
          <input type="number" className="wizard-select" min={1} value={st.allowedAttempts} onChange={e => update({ allowedAttempts: +e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Engine">
          <select className="wizard-select">
            <option>Standard</option>
            <option>Competitive</option>
            <option>Hall OMR</option>
          </select>
        </FieldWrap>
      </div>

      <Label>Options</Label>
      <Toggle label="Leaderboard" checked={st.leaderboard} onChange={v => update({ leaderboard: v })} />
      <Toggle label="Percentile display" checked={st.percentile} onChange={v => update({ percentile: v })} />
      <Toggle label="Solve sheet visible after submission" checked={st.solveSheet} onChange={v => update({ solveSheet: v })} />
      <Toggle label="OMR offline upload enabled" checked={st.omr} onChange={v => update({ omr: v })} />
    </>
  );

  // ─── Step 2: Method ─────────────────────────────────────────────────────
  const renderMethod = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Question fill method</div>
      <div className="text-xs text-slate-400 mb-4">Choose how the paper gets populated.</div>

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

  // ─── Step 3: Sets & Generate ────────────────────────────────────────────
  const renderSetsGenerate = () => (
    <>
      <div className="text-[15px] font-medium text-slate-900">Sets &amp; question generation</div>
      <div className="text-xs text-slate-400 mb-4">Browse nested folders, configure type counts, and generate variant sets.</div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        {/* Left: Folder tree */}
        <div>
          <Label className="mt-0">Browse &amp; select folders</Label>
          <FolderTreePanel tree={folderTree} selectedFolders={st.selectedFolders} onSelectionChange={folders => update({ selectedFolders: folders })} />

          <Label>Saved rule set</Label>
          <div className="flex gap-2 items-center">
            <select className="wizard-select flex-1">
              <option value="">— load a preset —</option>
              <option>VAP Weekly Bio standard</option>
              <option>VAP Model Test Bio+Phy</option>
              <option>Admission Full Syllabus</option>
            </select>
            <button className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-white transition-colors whitespace-nowrap">
              Save as rule set
            </button>
          </div>
        </div>

        {/* Right: Config */}
        <div className="space-y-3">
          <Label className="mt-0">Questions per set</Label>
          <div className="grid grid-cols-2 gap-3">
            <TypeCard dot="#378ADD" title="MCQ passage" sub="passages + child MCQs" value={st.mcqPassageCount} onChange={v => update({ mcqPassageCount: v })} />
            <TypeCard dot="#85B7EB" title="MCQ single" sub="standalone MCQs" value={st.mcqSingleCount} onChange={v => update({ mcqSingleCount: v })} />
            <TypeCard dot="#639922" title="CQ" sub="creative / structured" value={st.cqCount} onChange={v => update({ cqCount: v })} />
            <TypeCard dot="#BA7517" title="Short / written" sub="optional" value={st.shortCount} onChange={v => update({ shortCount: v })} />
          </div>

          <Label>Marks</Label>
          <div className="grid grid-cols-2 gap-3">
            <MarksInput label="Per question" value={st.marksPerQuestion} onChange={v => update({ marksPerQuestion: v })} />
            <MarksInput label="Negative mark" value={st.negativeMarks} onChange={v => update({ negativeMarks: v })} />
          </div>

          <Label>Set variants (A–Z)</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500">Number of sets</span>
            <input
              type="number"
              className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-center text-sm font-medium text-slate-900"
              min={1} max={26} value={st.setCount}
              onChange={e => update({ setCount: Math.max(1, Math.min(26, +e.target.value || 1)) })}
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

          <button
            className="w-full py-2.5 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={st.selectedFolders.size === 0 || generating}
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
    const labels = Array.from({ length: st.setCount }, (_, i) => setLabel(i));

    return (
      <>
        <div className="text-[15px] font-medium text-slate-900">Export &amp; download</div>
        <div className="text-xs text-slate-400 mb-4">Download each set for offline hall distribution or preview in browser.</div>

        <div className="flex gap-2 flex-wrap mb-4">
          <DlButton onClick={() => handleBulkDownload()}>All sets — PDF (ZIP)</DlButton>
          <DlButton onClick={() => handleBulkDownload()}>All sets — DOCX (ZIP)</DlButton>
          <DlButton onClick={handleSolveSheet}>Solve sheet</DlButton>
          <DlButton onClick={() => toast({ title: 'OMR', description: 'OMR template generation coming soon' })}>OMR template</DlButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {labels.map((label, i) => {
            const co = SET_COLORS[i % SET_COLORS.length];
            return (
              <div key={i} className="rounded-lg border border-slate-100 p-3 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-medium" style={{ background: co.bg, color: co.color }}>
                    {label}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">Set {label}</div>
                    <div className="text-[10px] text-slate-400">{totalQuestionsPerSet} Qs · {st.shuffle ? 'shuffled' : 'ordered'}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    className="flex-1 py-1 text-[10px] font-medium rounded-md border border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    onClick={() => handleSetPdf(label, i)}
                  >
                    PDF
                  </button>
                  <button className="flex-1 py-1 text-[10px] font-medium rounded-md border border-slate-200 text-slate-500 bg-slate-50 hover:bg-white transition-colors">
                    DOCX
                  </button>
                  <button className="flex-1 py-1 text-[10px] font-medium rounded-md border border-slate-200 text-slate-500 bg-slate-50 hover:bg-white transition-colors">
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

      <Label>Publish action</Label>
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
    if (st.selectedFolders.size === 0) return;

    try {
      setGenerating(true);

      // Step 1: Create or update exam
      let examId = generatedExam?.id;
      
      const examPayload: CreateExamDto = {
        title: st.title.trim(),
        courseId: st.courseId,
        branchId: st.branchId || '',
        batchId: st.batchId || undefined,
        type: st.type,
        mode: st.mode,
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

      // Step 2: Add questions to sets using auto-generate
      const folderIds = Array.from(st.selectedFolders);
      
      // Use the first selected folder to add questions with auto-generation
      const addRes = await addQuestionsToSet({
        examSetId: '', // empty - backend creates sets in auto mode
        folderId: folderIds[0],
        shuffleQuestions: st.shuffle,
        autoSetCount: st.setCount,
        count: totalQuestionsPerSet,
        cqCount: st.cqCount,
        mcqSingleCount: st.mcqSingleCount,
        mcqPassageCount: st.mcqPassageCount,
        marks: st.marksPerQuestion,
        negativeMarks: st.negativeMarks,
      });

      if (!addRes.success) throw new Error('Failed to add questions');

      // Refresh exam data
      const refreshed = await getExamById(examId);
      if (refreshed.success && refreshed.data) {
        setGeneratedExam(refreshed.data);
      }

      toast({ title: 'Success', description: `Generated ${st.setCount} set(s) with ${totalQuestionsPerSet} questions each`, variant: 'success' });
      
      // Jump to downloads step
      setStep(3);
      setMaxStep(prev => Math.max(prev, 3));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkDownload = async () => {
    if (!generatedExam?.id) return;
    try {
      const res = await regenerateExamPdf(generatedExam.id);
      if (res.success && res.data?.pdfUrl) {
        window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  const handleSolveSheet = async () => {
    if (!generatedExam?.id) return;
    try {
      const res = await regenerateSolveSheet(generatedExam.id);
      if (res.success && res.data?.solveSheetUrl) {
        window.open(getExamPdfDownloadUrl(res.data.solveSheetUrl), '_blank');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate solve sheet', variant: 'destructive' });
    }
  };

  const handleSetPdf = async (label: string, index: number) => {
    if (!generatedExam?.id || !generatedExam.sets?.[index]) return;
    try {
      const setId = generatedExam.sets[index].id;
      const res = await generateSetPdf(generatedExam.id, setId);
      if (res.success && res.data?.pdfUrl) {
        window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
      }
    } catch {
      toast({ title: 'Error', description: `Failed to generate PDF for Set ${label}`, variant: 'destructive' });
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);

      let examId = generatedExam?.id;
      const payload: CreateExamDto = {
        title: st.title.trim(),
        courseId: st.courseId,
        branchId: st.branchId || '',
        batchId: st.batchId || undefined,
        type: st.type,
        mode: st.mode,
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

      <style jsx>{`
        .wizard-select {
          width: 100%;
          font-size: 13px;
          color: #1e293b;
          border: 0.5px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          background: #fff;
          outline: none;
          font-family: inherit;
        }
        .wizard-select:focus {
          box-shadow: 0 0 0 2px rgba(55, 138, 221, 0.15);
          border-color: #378ADD;
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-4 mb-1.5', className)}>
      {children}
    </div>
  );
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
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
  selected: boolean; onClick: () => void; icon: React.ReactNode; iconBg: string;
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
    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
      <div className="flex-1">
        <div className="w-1.75 h-1.75 rounded-full mb-1" style={{ background: dot }} />
        <div className="text-xs font-medium text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-400">{sub}</div>
      </div>
      <input
        type="number"
        className="w-15 rounded-md border border-slate-200 px-2 py-1.5 text-center text-[15px] font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        min={0} max={99} value={value}
        onChange={e => onChange(Math.max(0, +e.target.value || 0))}
      />
    </div>
  );
}

function MarksInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-md">
      <span className="text-[11px] text-slate-500 flex-1">{label}</span>
      <input
        type="number"
        className="w-14 rounded-md border border-slate-200 px-2 py-1 text-center text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
        min={0} step={0.25} value={value}
        onChange={e => onChange(+e.target.value || 0)}
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
        if (n.children?.length) walk(n.children);
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

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
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

function DlButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-white transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── Folder Tree Panel ──────────────────────────────────────────────────
function FolderTreePanel({ tree, selectedFolders, onSelectionChange }: {
  tree: FolderTreeNode[];
  selectedFolders: Set<string>;
  onSelectionChange: (folders: Set<string>) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(new Set());

  // Compute search-expanded IDs via useMemo (no setState in effect)
  const searchExpandedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const result = new Set<string>();
    function walk(nodes: FolderTreeNode[]) {
      for (const n of nodes) {
        if (n.name.toLowerCase().includes(q)) result.add(n.id);
        if (n.children.length) {
          walk(n.children);
          if (n.children.some(c => result.has(c.id))) result.add(n.id);
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

  const selectAll = useCallback((node: FolderTreeNode, checked: boolean) => {
    const next = new Set(selectedFolders);
    function walk(n: FolderTreeNode) {
      if (n.children.length === 0) {
        if (checked) next.add(n.id); else next.delete(n.id);
      }
      n.children.forEach(walk);
    }
    walk(node);
    onSelectionChange(next);
  }, [selectedFolders, onSelectionChange]);

  // Collect selected leaf names for tags
  const selectedLeafNames = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    function walk(nodes: FolderTreeNode[]) {
      for (const n of nodes) {
        if (selectedFolders.has(n.id)) result.push({ id: n.id, name: n.name });
        if (n.children.length) walk(n.children);
      }
    }
    walk(tree);
    return result;
  }, [tree, selectedFolders]);

  const q = searchQuery.toLowerCase();

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <input
          className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          placeholder="Search folders..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tree */}
      <div className="max-h-80 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="p-4 text-xs text-slate-400 text-center">
            {!q ? 'No question folders found. Select a course first.' : 'No matching folders.'}
          </div>
        ) : (
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
      <div className="flex flex-wrap gap-1 px-3 py-2 min-h-9.5 border-t border-slate-100 bg-white">
        {selectedLeafNames.length === 0 ? (
          <span className="text-[11px] text-slate-400">No folders selected — browse and check above</span>
        ) : (
          selectedLeafNames.map(leaf => (
            <div key={leaf.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-[11px] font-medium text-blue-800">
              {leaf.name}
              <button className="text-blue-700 hover:text-blue-900" onClick={() => toggleSelect(leaf.id)}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
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
      {nodes.map(node => {
        const isLeaf = node.children.length === 0;
        const isExpanded = expandedIds.has(node.id);
        const nameMatches = !searchQuery || node.name.toLowerCase().includes(searchQuery);
        const totalMcq = node.counts.mcqSingle + node.counts.mcqPassage;

        // Check if any children (recursively) are selected
        function hasSelectedChild(n: FolderTreeNode): boolean {
          if (selectedFolders.has(n.id)) return true;
          return n.children.some(hasSelectedChild);
        }
        function allLeavesSelected(n: FolderTreeNode): boolean {
          if (n.children.length === 0) return selectedFolders.has(n.id);
          return n.children.every(allLeavesSelected);
        }

        if (searchQuery && !nameMatches && isLeaf) return null;

        if (isLeaf) {
          return (
            <div
              key={node.id}
              className="flex items-center gap-1.5 py-1.5 px-2 text-xs text-slate-600 cursor-pointer hover:bg-white"
              style={{ paddingLeft: 12 + depth * 14 }}
              onClick={() => toggleSelect(node.id)}
            >
              <FileText className="h-2.5 w-2.5 text-slate-400 shrink-0" />
              <span className="flex-1 truncate">{node.name}</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{totalMcq}M·{node.counts.cq}C</span>
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
        const allSelected = allLeavesSelected(node);
        const someSelected = hasSelectedChild(node);

        // Aggregate counts for this parent
        let aggMcq = 0, aggCq = 0;
        function sumCounts(n: FolderTreeNode) {
          aggMcq += n.counts.mcqSingle + n.counts.mcqPassage;
          aggCq += n.counts.cq;
          n.children.forEach(sumCounts);
        }
        sumCounts(node);

        return (
          <div key={node.id}>
            <div
              className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-white text-sm text-slate-900"
              style={{ paddingLeft: 6 + depth * 14 }}
            >
              <button
                className="w-3 h-3 flex items-center justify-center text-slate-400 shrink-0"
                onClick={() => toggleExpand(node.id)}
              >
                <ChevronRight className={cn('h-2.5 w-2.5 transition-transform', isExpanded && 'rotate-90')} />
              </button>
              <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" onClick={() => toggleExpand(node.id)} />
              <span className="flex-1 text-[13px] truncate" onClick={() => toggleExpand(node.id)}>{node.name}</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{aggMcq}M·{aggCq}C</span>
              <input
                type="checkbox"
                className="w-3 h-3 accent-blue-500 shrink-0"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={e => selectAll(node, e.target.checked)}
                onClick={e => e.stopPropagation()}
              />
            </div>
            {isExpanded && (
              <FolderTreeNodes
                nodes={node.children}
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
