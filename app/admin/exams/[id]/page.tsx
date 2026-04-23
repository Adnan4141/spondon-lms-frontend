'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Eye, EyeOff, Download, RefreshCw,
  BookOpen, Zap, FileText, BarChart2, Settings,
  Clock, Hash, Layers, Users, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getExamById, updateExam, getExamPdfDownloadUrl, regenerateExamPdf, getExamAnalytics } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';
import { ENGINE_CONFIG, MODE_CONFIG, STATUS_CONFIG, ExamFormModal } from '../_components';
import { QuestionBankTab } from './_question-bank';
import { PaperGenerationTab } from './_paper-generation';
import { SolveSheetTab } from './_solve-sheet';
import { ResultsTab } from './_results';
import { SettingsTab } from './_settings';

const NAVY = '#1e3a5f';

type TabId = 'questions' | 'paper' | 'solve' | 'results' | 'settings';

const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
  { id: 'questions', icon: <BookOpen className="h-4 w-4" />, label: 'Question Bank' },
  { id: 'paper',     icon: <Zap className="h-4 w-4" />,       label: 'Paper Generation' },
  { id: 'solve',     icon: <FileText className="h-4 w-4" />,  label: 'Solve Sheet' },
  { id: 'results',   icon: <BarChart2 className="h-4 w-4" />, label: 'Results' },
  { id: 'settings',  icon: <Settings className="h-4 w-4" />,  label: 'Settings' },
];

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [exam, setExam]       = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('questions');
  const [editOpen, setEditOpen] = useState(false);
  const [analytics, setAnalytics] = useState<{ totalAttempts: number; average: number; highest: number; passFail: { passRate: number } } | null>(null);

  const loadExam = useCallback(async () => {
    setLoading(true);
    const res = await getExamById(id);
    if (res.success && res.data) setExam(res.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadExam(); }, [loadExam]);

  useEffect(() => {
    if (!id) return;
    getExamAnalytics(id).then(r => {
      if (r.success && r.data) setAnalytics(r.data as any);
    });
  }, [id]);

  // Sync tab with URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (TABS.some(t => t.id === hash)) setActiveTab(hash);
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as TabId;
      if (TABS.some(t => t.id === h)) setActiveTab(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handlePublish = async () => {
    if (!exam) return;
    const res = await updateExam(exam.id, { status: 'PUBLISHED' });
    if (res.success && res.data) {
      setExam(res.data);
      toast({ description: 'Exam published!' });
    }
  };

  const handleDownloadPdf = async () => {
    if (!exam) return;
    if (exam.pdfUrl) {
      window.open(getExamPdfDownloadUrl(exam.pdfUrl), '_blank');
      return;
    }
    const res = await regenerateExamPdf(exam.id);
    if (res.success && res.data?.pdfUrl) {
      setExam(prev => prev ? { ...prev, pdfUrl: res.data!.pdfUrl } : prev);
      window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
    }
  };

  const handleExamUpdated = (updated: Exam) => {
    setExam(updated);
    setEditOpen(false);
    toast({ description: 'Exam updated!' });
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-sm">Exam not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/exams')}>
          Back to Exams
        </Button>
      </div>
    );
  }

  const engineCfg = ENGINE_CONFIG[exam.examEngine ?? 'REGULAR'] ?? ENGINE_CONFIG.REGULAR;
  const modeCfg   = MODE_CONFIG[exam.mode];
  const statusCfg = STATUS_CONFIG[exam.status];
  const s = (exam.settings ?? {}) as Record<string, unknown>;

  return (
    <>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/admin/exams')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Exams
            </button>
            <span className="text-slate-300 shrink-0">/</span>
            <h1 className="text-lg font-black text-slate-900 truncate">{exam.title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {exam.status === 'DRAFT' && (
              <Button size="sm" onClick={handlePublish} className="gap-1.5 text-white" style={{ background: NAVY }}>
                <Eye className="h-3.5 w-3.5" /> Publish
              </Button>
            )}
            {exam.status === 'PUBLISHED' && (
              <Button size="sm" variant="outline" onClick={handlePublish}>
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDownloadPdf} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>

        {/* ── Badges + stat chips ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold', engineCfg.bg, engineCfg.tc)}>
              {engineCfg.label}
            </span>
            <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold', modeCfg.bg, modeCfg.tc)}>
              {modeCfg.label}
            </span>
            <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold', statusCfg.bg, statusCfg.tc)}>
              {statusCfg.label}
            </span>
            {exam.scope === 'GLOBAL' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600">
                Global
              </span>
            )}
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: <Hash className="h-3.5 w-3.5" />,        label: 'Questions',  val: (s.questionCount as number) ?? '—', tc: 'text-blue-600',   bg: 'bg-blue-50'   },
              { icon: <Clock className="h-3.5 w-3.5" />,       label: 'Duration',   val: exam.durationMinutes ? `${exam.durationMinutes}m` : '—', tc: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: <Layers className="h-3.5 w-3.5" />,      label: 'Sets',       val: exam.totalSets ?? 1, tc: 'text-teal-600',   bg: 'bg-teal-50'   },
              { icon: <Users className="h-3.5 w-3.5" />,       label: 'Attempts',   val: analytics?.totalAttempts ?? (exam._count?.attempts ?? 0), tc: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: <TrendingUp className="h-3.5 w-3.5" />,  label: 'Pass Rate',  val: analytics ? `${Math.round(analytics.passFail.passRate * 100)}%` : '—', tc: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(chip => (
              <div key={chip.label} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', chip.bg)}>
                <span className={chip.tc}>{chip.icon}</span>
                <div>
                  <p className={cn('text-sm font-black leading-none', chip.tc)}>{chip.val}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{chip.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all shrink-0',
                  activeTab === tab.id
                    ? 'border-rose-600 text-rose-600 bg-rose-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab panels ── */}
          <div className="p-5">
            {activeTab === 'questions' && (
              <QuestionBankTab exam={exam} onExamChange={setExam} />
            )}
            {activeTab === 'paper' && (
              <PaperGenerationTab exam={exam} onExamChange={setExam} />
            )}
            {activeTab === 'solve' && (
              <SolveSheetTab exam={exam} onExamChange={setExam} />
            )}
            {activeTab === 'results' && (
              <ResultsTab exam={exam} onExamChange={setExam} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab exam={exam} onExamChange={setExam} />
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <ExamFormModal
        open={editOpen}
        exam={exam}
        courses={exam.course ? [exam.course as any] : []}
        branches={exam.branch ? [exam.branch as any] : []}
        onClose={() => setEditOpen(false)}
        onSaved={handleExamUpdated}
      />

      <Toaster />
    </>
  );
}
