'use client';

/**
 * Admin Exam detail — shell with 4 shadcn Tabs (Builder / Questions / Results /
 * Leaderboard). Top navbar and stat cards are both shadcn-only.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Hash,
  Layers,
  Pencil,
  Settings2,
  Trophy,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

import {
  getExamById,
  getExamPdfDownloadUrl,
  getExamAnalytics,
  getExamBundleZipUrl,
  regenerateExamPdf,
  updateExam,
} from '@/lib/api/exams';
import type { Exam } from '@/types/exam';

import { ENGINE_CONFIG, MODE_CONFIG, STATUS_CONFIG, ExamFormModal } from '../_components';
import { BuilderTab } from './_builder-tab';
import { QuestionsTab } from './_questions-tab';
import { ResultsTab } from './_results-tab';
import { LeaderboardTab } from './_leaderboard-tab';

// Deep Navy / Warm Gold / Clean White — central token map
const C = {
  navy: '#0F1E3C',
  navyInk: '#0B1730',
  gold: '#C9A85C',
  goldSoft: '#F3E7C7',
  paper: '#FFFFFF',
  mist: '#F5F7FB',
} as const;

type TabId = 'builder' | 'questions' | 'results' | 'leaderboard';

const TABS: { id: TabId; label: string }[] = [
  { id: 'builder', label: 'Builder' },
  { id: 'questions', label: 'Questions' },
  { id: 'results', label: 'Results' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('builder');
  const [editOpen, setEditOpen] = useState(false);
  const [analytics, setAnalytics] = useState<{
    totalAttempts: number;
    average: number;
    highest: number;
    passFail: { passRate: number };
  } | null>(null);

  const loadExam = useCallback(async () => {
    setLoading(true);
    const res = await getExamById(id);
    if (res.success && res.data) setExam(res.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  useEffect(() => {
    if (!id) return;
    getExamAnalytics(id).then((r) => {
      if (r.success && r.data) setAnalytics(r.data as typeof analytics);
    });
  }, [id]);

  // Hash-sync active tab
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash);
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as TabId;
      if (TABS.some((t) => t.id === h)) setActiveTab(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (tab: string) => {
    setActiveTab(tab as TabId);
    window.location.hash = tab;
  };

  const handlePublish = async () => {
    if (!exam) return;
    const nextStatus = exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const res = await updateExam(exam.id, { status: nextStatus });
    if (res.success && res.data) {
      setExam(res.data);
      toast({
        description: nextStatus === 'PUBLISHED' ? 'Exam published' : 'Exam unpublished',
      });
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
      setExam((prev) => (prev ? { ...prev, pdfUrl: res.data!.pdfUrl } : prev));
      window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
    }
  };

  const handleDownloadZip = () => {
    if (!exam) return;
    window.open(getExamBundleZipUrl(exam.id), '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted-foreground">Exam not found.</p>
        <Button variant="outline" onClick={() => router.push('/admin/exams')}>
          Back to exams
        </Button>
      </div>
    );
  }

  const engineCfg = ENGINE_CONFIG[exam.examEngine ?? 'REGULAR'] ?? ENGINE_CONFIG.REGULAR;
  const modeCfg = MODE_CONFIG[exam.mode];
  const statusCfg = STATUS_CONFIG[exam.status];
  const settings = (exam.settings ?? {}) as Record<string, unknown>;

  return (
    <>
      {/* ── Navy top bar ────────────────────────────────────────────────── */}
      <div
        className="-mx-4 mb-5 flex items-center justify-between gap-4 px-4 py-3 sm:-mx-6 sm:px-6"
        style={{ backgroundColor: C.navy, color: C.paper }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/exams')}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Exams
          </Button>
          <span className="opacity-60">/</span>
          <h1 className="truncate text-base font-semibold">{exam.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/40 text-white"
            style={{ backgroundColor: 'transparent' }}
          >
            {statusCfg.label}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={handleDownloadZip}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Bundle (ZIP)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={handleDownloadPdf}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            style={{ backgroundColor: C.gold, color: C.navyInk }}
          >
            {exam.status === 'PUBLISHED' ? (
              <>
                <EyeOff className="mr-1 h-3.5 w-3.5" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-1 h-3.5 w-3.5" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── Exam header + stat cards ─────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={engineCfg.variant}>{engineCfg.label}</Badge>
              <Badge variant="outline">{modeCfg.label}</Badge>
              {exam.scope === 'GLOBAL' && <Badge variant="secondary">Global</Badge>}
              {exam.language && <Badge variant="outline">{exam.language.toUpperCase()}</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard
                icon={Hash}
                label="Questions"
                value={
                  (settings.questionCount as number) ??
                  exam.sets?.[0]?.questions?.length ??
                  '—'
                }
              />
              <StatCard
                icon={ClipboardList}
                label="Duration"
                value={exam.durationMinutes ? `${exam.durationMinutes} min` : '—'}
              />
              <StatCard
                icon={BookOpen}
                label="Total Marks"
                value={(settings.totalMarks as number) ?? '—'}
              />
              <StatCard icon={Layers} label="Sets" value={exam.totalSets ?? 1} />
              <StatCard
                icon={Users}
                label="Attempts"
                value={analytics?.totalAttempts ?? exam._count?.attempts ?? 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── 4-tab body ──────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={switchTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="builder">
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="questions">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="results">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Results
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="mr-1.5 h-3.5 w-3.5" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-4">
            <BuilderTab exam={exam} onExamChange={setExam} />
          </TabsContent>
          <TabsContent value="questions" className="mt-4">
            <QuestionsTab exam={exam} />
          </TabsContent>
          <TabsContent value="results" className="mt-4">
            <ResultsTab exam={exam} onExamChange={setExam} />
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-4">
            <LeaderboardTab exam={exam} />
          </TabsContent>
        </Tabs>
      </div>

      <ExamFormModal
        open={editOpen}
        exam={exam}
        courses={exam.course ? [{ id: exam.course.id, name: exam.course.name }] : []}
        branches={exam.branch ? [exam.branch] : []}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setExam(updated);
          setEditOpen(false);
          toast({ description: 'Exam updated' });
        }}
      />

      <Toaster />
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: '#F3E7C7', color: '#0B1730' }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-none" style={{ color: '#0B1730' }}>
          {value}
        </p>
        <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
