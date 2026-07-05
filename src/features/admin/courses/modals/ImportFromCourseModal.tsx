'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileDown,
  GraduationCap,
  Layers,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getCourses, getCourseContents, getCourseById } from '@/lib/api/courses';
import { getCurriculumTree } from '@/lib/api/curriculum';
import { importCourseContent, type ImportConflictStrategy } from '@/lib/api/course-content-import';
import type { Course } from '@/types/course';
import type { CurriculumTreeNode } from '@/features/admin/curriculum/curriculum-types';
import { groupContents } from '../courseUtils';
import type { SubjectGroup } from '../courseTypes';
import {
  countCurriculumSelection,
  countLegacySelection,
  isLegacyChapterFullySelected,
  isLegacySubjectFullySelected,
  isNodeFullySelected,
  selectAllCurriculumNodes,
  selectAllLegacyContent,
  toggleLegacyChapterSelection,
  toggleLegacySubjectSelection,
  toggleNodeSelection,
  type ImportSelectionStats,
} from '../import-content-utils';

type Step = 1 | 2 | 3;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetCourseId: string;
  targetCourseName: string;
  onSuccess: () => void;
};

const STEPS: { id: Step; label: string; hint: string }[] = [
  { id: 1, label: 'Source', hint: 'Pick a course' },
  { id: 2, label: 'Select', hint: 'Choose content' },
  { id: 3, label: 'Confirm', hint: 'Review & import' },
];

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mt-5 flex items-center gap-0">
      {STEPS.map((s, idx) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black transition-all duration-300',
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-4 ring-indigo-100'
                      : 'border-slate-200 bg-white text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.id}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'text-[11px] font-black uppercase tracking-wider',
                    active ? 'text-indigo-700' : done ? 'text-emerald-700' : 'text-slate-400',
                  )}
                >
                  {s.label}
                </p>
                <p className="hidden text-[10px] text-slate-400 sm:block">{s.hint}</p>
              </div>
            </div>
            {idx < STEPS.length - 1 ? (
              <div
                className={cn(
                  'mx-1 mb-5 h-0.5 flex-1 rounded-full transition-colors duration-300',
                  step > s.id ? 'bg-emerald-400' : 'bg-slate-200',
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StatsGrid({ stats }: { stats: ImportSelectionStats }) {
  const items = [
    { label: 'Subjects', val: stats.subjects, icon: BookOpen, tone: 'from-violet-500 to-purple-600' },
    { label: 'Chapters', val: stats.chapters, icon: Layers, tone: 'from-indigo-500 to-blue-600' },
    { label: 'Lessons', val: stats.lessons, icon: GraduationCap, tone: 'from-sky-500 to-cyan-600' },
    { label: 'Resources', val: stats.resources, icon: FileDown, tone: 'from-emerald-500 to-teal-600' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(({ label, val, icon: Icon, tone }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
        >
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-[0.06]', tone)} />
          <div className="relative flex items-center gap-2.5">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', tone)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-lg font-black leading-none text-slate-900">{val}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  SUBJECT: { label: 'Subject', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  CHAPTER: { label: 'Chapter', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  LESSON: { label: 'Lesson', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
};

function CurriculumTreeRow({
  node,
  depth,
  expanded,
  onToggleExpand,
  selectedIds,
  onToggleSelect,
}: {
  node: CurriculumTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (node: CurriculumTreeNode, checked: boolean) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOpen = expanded.has(node.id);
  const fullySelected = isNodeFullySelected(node, selectedIds);
  const badge = TYPE_BADGE[node.type] ?? TYPE_BADGE.LESSON;

  const meta =
    node.type === 'LESSON'
      ? `${node.resources?.length ?? node.resourceCount ?? 0} resources`
      : node.type === 'CHAPTER'
        ? `${node.children?.length ?? 0} lessons`
        : `${node.children?.length ?? 0} chapters`;

  return (
    <>
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 transition-all hover:border-slate-100 hover:bg-slate-50/80',
          fullySelected && 'border-indigo-100 bg-indigo-50/40',
        )}
        style={{ marginLeft: `${depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-indigo-600"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-7 shrink-0" />
        )}
        <Checkbox
          checked={fullySelected}
          onCheckedChange={(v) => onToggleSelect(node, v === true)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-800">{node.title}</p>
            <span className={cn('shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide', badge.cls)}>
              {badge.label}
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">{meta}</p>
        </div>
      </div>
      {hasChildren && isOpen
        ? node.children.map((child) => (
            <CurriculumTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
            />
          ))
        : null}
    </>
  );
}

function LegacyTreeRow({
  subjects,
  expanded,
  onToggleExpand,
  selectedIds,
  onToggleSubject,
  onToggleChapter,
  onToggleItem,
}: {
  subjects: SubjectGroup[];
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  selectedIds: Set<string>;
  onToggleSubject: (subject: SubjectGroup, checked: boolean) => void;
  onToggleChapter: (chapter: SubjectGroup['chapters'][number], checked: boolean) => void;
  onToggleItem: (id: string, checked: boolean) => void;
}) {
  return (
    <>
      {subjects.map((subject) => {
        const subjectKey = `subj:${subject.name}`;
        const subOpen = expanded.has(subjectKey);
        const subSelected = isLegacySubjectFullySelected(subject, selectedIds);
        return (
          <div key={subjectKey}>
            <div
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 transition-all hover:bg-slate-50/80',
                subSelected && 'border-indigo-100 bg-indigo-50/40',
              )}
            >
              <button
                type="button"
                onClick={() => onToggleExpand(subjectKey)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600"
              >
                {subOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <Checkbox
                checked={subSelected}
                onCheckedChange={(v) => onToggleSubject(subject, v === true)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{subject.name}</p>
                  <span className="rounded-md border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-700">
                    Subject
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{subject.chapters.length} chapters</p>
              </div>
            </div>
            {subOpen
              ? subject.chapters.map((chapter) => {
                  const chapterKey = `chap:${subject.name}:::${chapter.name}`;
                  const chapOpen = expanded.has(chapterKey);
                  const chapSelected = isLegacyChapterFullySelected(chapter, selectedIds);
                  return (
                    <div key={chapterKey} className="ml-5">
                      <div
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 transition-all hover:bg-slate-50/80',
                          chapSelected && 'border-indigo-100 bg-indigo-50/40',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleExpand(chapterKey)}
                          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600"
                        >
                          {chapOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <Checkbox
                          checked={chapSelected}
                          onCheckedChange={(v) => onToggleChapter(chapter, v === true)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-700">{chapter.name}</p>
                            <span className="rounded-md border border-indigo-200 bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-indigo-700">
                              Chapter
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{chapter.items.length} lessons</p>
                        </div>
                      </div>
                      {chapOpen
                        ? chapter.items.map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                'ml-10 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-slate-50',
                                selectedIds.has(item.id) && 'bg-indigo-50/30',
                              )}
                            >
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={(v) => onToggleItem(item.id, v === true)}
                              />
                              <p className="truncate text-sm text-slate-600">{item.title}</p>
                            </div>
                          ))
                        : null}
                    </div>
                  );
                })
              : null}
          </div>
        );
      })}
    </>
  );
}

function CourseSourceCard({ course, onSelect }: { course: Course; onSelect: () => void }) {
  const hasCurriculum = (course.curriculumNodeCount ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/10"
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105',
          hasCurriculum ? 'from-indigo-500 to-violet-600' : 'from-slate-500 to-slate-700',
        )}
      >
        <BookOpen className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-900">{course.name}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{course.slug}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide',
            hasCurriculum
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-slate-50 text-slate-500',
          )}
        >
          {hasCurriculum ? 'Curriculum' : 'Legacy'}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
      </div>
    </button>
  );
}

function OptionCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all',
        checked
          ? 'border-indigo-200 bg-indigo-50/50 shadow-sm'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50',
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
      </div>
    </label>
  );
}

export function ImportFromCourseModal({
  open,
  onOpenChange,
  targetCourseId,
  targetCourseName,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseQuery, setCourseQuery] = useState('');
  const [sourceCourseId, setSourceCourseId] = useState('');
  const [sourceCourseName, setSourceCourseName] = useState('');
  const [sourceHasCurriculum, setSourceHasCurriculum] = useState<boolean | null>(null);
  const [curriculumTree, setCurriculumTree] = useState<CurriculumTreeNode[]>([]);
  const [legacySubjects, setLegacySubjects] = useState<SubjectGroup[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedLegacyIds, setSelectedLegacyIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [conflictStrategy, setConflictStrategy] = useState<ImportConflictStrategy>('RENAME');
  const [copyFiles, setCopyFiles] = useState(true);
  const [includeTeachers, setIncludeTeachers] = useState(false);
  const [includeVisibility, setIncludeVisibility] = useState(true);
  const [importing, setImporting] = useState(false);

  const reset = useCallback(() => {
    setStep(1);
    setCourseQuery('');
    setSourceCourseId('');
    setSourceCourseName('');
    setSourceHasCurriculum(null);
    setCurriculumTree([]);
    setLegacySubjects([]);
    setSelectedNodeIds(new Set());
    setSelectedLegacyIds(new Set());
    setExpanded(new Set());
    setConflictStrategy('RENAME');
    setCopyFiles(true);
    setIncludeTeachers(false);
    setIncludeVisibility(true);
    setImporting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    let cancelled = false;
    setCoursesLoading(true);
    getCourses({ all: true })
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setCourses(res.data.filter((c) => c.id !== targetCourseId));
        }
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, targetCourseId, reset]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [courses, courseQuery]);

  const loadSourceContent = useCallback(async (courseId: string) => {
    setContentLoading(true);
    setCurriculumTree([]);
    setLegacySubjects([]);
    setSelectedNodeIds(new Set());
    setSelectedLegacyIds(new Set());
    setExpanded(new Set());

    try {
      const courseRes = await getCourseById(courseId);
      const nodeCount =
        courseRes.success && courseRes.data
          ? Number((courseRes.data as Course).curriculumNodeCount ?? 0)
          : 0;
      const hasCurriculum = nodeCount > 0;
      setSourceHasCurriculum(hasCurriculum);

      if (hasCurriculum) {
        const treeRes = await getCurriculumTree(courseId);
        if (treeRes.success && treeRes.data) {
          const tree = ((treeRes.data as { tree?: CurriculumTreeNode[] }).tree ?? []) as CurriculumTreeNode[];
          setCurriculumTree(tree);
          setSelectedNodeIds(selectAllCurriculumNodes(tree));
          setExpanded(new Set(tree.map((n) => n.id)));
        }
      } else {
        const contentsRes = await getCourseContents({ courseId });
        const grouped = groupContents(contentsRes.data ?? []);
        setLegacySubjects(grouped);
        setSelectedLegacyIds(selectAllLegacyContent(grouped));
        setExpanded(new Set(grouped.map((s) => `subj:${s.name}`)));
      }
    } catch (e: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to load source content',
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setContentLoading(false);
    }
  }, [toast]);

  const handleSelectSource = (course: Course) => {
    setSourceCourseId(course.id);
    setSourceCourseName(course.name);
    void loadSourceContent(course.id);
    setStep(2);
  };

  const selectionStats = useMemo(() => {
    if (sourceHasCurriculum) {
      return countCurriculumSelection(curriculumTree, selectedNodeIds);
    }
    return countLegacySelection(legacySubjects, selectedLegacyIds);
  }, [sourceHasCurriculum, curriculumTree, selectedNodeIds, legacySubjects, selectedLegacyIds]);

  const hasSelection =
    sourceHasCurriculum === true
      ? selectedNodeIds.size > 0
      : sourceHasCurriculum === false
        ? selectedLegacyIds.size > 0
        : false;

  const handleImport = async () => {
    if (!sourceCourseId || !hasSelection) return;
    setImporting(true);
    try {
      const res = await importCourseContent(targetCourseId, {
        sourceCourseId,
        nodeIds: sourceHasCurriculum ? Array.from(selectedNodeIds) : undefined,
        legacyContentIds: sourceHasCurriculum === false ? Array.from(selectedLegacyIds) : undefined,
        conflictStrategy,
        copyFiles,
        includeTeachers,
        includeVisibility,
      });

      if (!res.success) {
        throw new Error(res.message || 'Import failed');
      }

      const data = res.data!;
      const totalAdded =
        data.added.subjects + data.added.chapters + data.added.lessons + data.added.resources;

      toast({
        title: 'Content imported',
        description: `Added ${data.added.subjects} subjects, ${data.added.chapters} chapters, ${data.added.lessons} lessons, ${data.added.resources} resources.`,
      });

      if (data.warnings?.length) {
        toast({
          title: `${data.warnings.length} warning(s)`,
          description: data.warnings.slice(0, 2).join(' · '),
        });
      }

      if (totalAdded === 0) {
        toast({
          variant: 'destructive',
          title: 'Nothing imported',
          description: 'All selected items were skipped (name conflicts or empty selection).',
        });
        return;
      }

      onOpenChange(false);
      onSuccess();
    } catch (e: unknown) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setImporting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl sm:max-w-[640px]"
      >
        <DialogTitle className="sr-only">Import from another course</DialogTitle>
        <DialogDescription className="sr-only">
          Copy course content into {targetCourseName}
        </DialogDescription>

        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50/60 px-6 pb-5 pt-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 50%)',
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
                <Copy className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  Import from another course
                </h2>
                <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Copy subjects, chapters, lessons & resources into{' '}
                  <span className="font-bold text-indigo-700">{targetCourseName}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <StepIndicator step={step} />
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 px-6 py-5">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                  placeholder="Search courses by name or slug…"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              {coursesLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Loading courses…</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                  <BookOpen className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">No courses found</p>
                  <p className="text-xs text-slate-400">Try a different search term</p>
                </div>
              ) : (
                <div className="max-h-[340px] space-y-2 overflow-y-auto pr-0.5">
                  {filteredCourses.map((course) => (
                    <CourseSourceCard
                      key={course.id}
                      course={course}
                      onSelect={() => handleSelectSource(course)}
                    />
                  ))}
                </div>
              )}

              {!coursesLoading && filteredCourses.length > 0 ? (
                <p className="text-center text-[11px] font-medium text-slate-400">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
                </p>
              ) : null}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white p-3.5 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Source course</p>
                  <p className="truncate text-sm font-bold text-slate-900">{sourceCourseName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="shrink-0 cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Change
                </button>
              </div>

              {contentLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Loading content tree…</p>
                </div>
              ) : sourceHasCurriculum && curriculumTree.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  This course has no curriculum content to import.
                </div>
              ) : !sourceHasCurriculum && legacySubjects.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  This course has no content rows to import.
                </div>
              ) : (
                <>
                  <StatsGrid stats={selectionStats} />
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Select content</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-slate-200 bg-white text-xs font-bold shadow-sm"
                      onClick={() => {
                        if (sourceHasCurriculum) {
                          setSelectedNodeIds(selectAllCurriculumNodes(curriculumTree));
                        } else {
                          setSelectedLegacyIds(selectAllLegacyContent(legacySubjects));
                        }
                      }}
                    >
                      Select all
                    </Button>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-inner">
                    {sourceHasCurriculum ? (
                      curriculumTree.map((node) => (
                        <CurriculumTreeRow
                          key={node.id}
                          node={node}
                          depth={0}
                          expanded={expanded}
                          onToggleExpand={toggleExpand}
                          selectedIds={selectedNodeIds}
                          onToggleSelect={(n, checked) =>
                            setSelectedNodeIds(toggleNodeSelection(n, selectedNodeIds, checked))
                          }
                        />
                      ))
                    ) : (
                      <LegacyTreeRow
                        subjects={legacySubjects}
                        expanded={expanded}
                        onToggleExpand={toggleExpand}
                        selectedIds={selectedLegacyIds}
                        onToggleSubject={(subject, checked) =>
                          setSelectedLegacyIds(toggleLegacySubjectSelection(subject, selectedLegacyIds, checked))
                        }
                        onToggleChapter={(chapter, checked) =>
                          setSelectedLegacyIds(toggleLegacyChapterSelection(chapter, selectedLegacyIds, checked))
                        }
                        onToggleItem={(id, checked) => {
                          const next = new Set(selectedLegacyIds);
                          if (checked) next.add(id);
                          else next.delete(id);
                          setSelectedLegacyIds(next);
                        }}
                      />
                    )}
                  </div>
                  {!sourceHasCurriculum ? (
                    <p className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                      Legacy content will be converted to curriculum structure on import.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Flow visual */}
              <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{sourceCourseName}</p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Into</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-indigo-900">{targetCourseName}</p>
                  </div>
                </div>
              </div>

              <StatsGrid stats={selectionStats} />

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Import options
                </p>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">If name already exists</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['RENAME', 'SKIP'] as ImportConflictStrategy[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setConflictStrategy(v)}
                        className={cn(
                          'cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-black transition-all',
                          conflictStrategy === v
                            ? 'border-indigo-300 bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white',
                        )}
                      >
                        {v === 'RENAME' ? 'Rename (Copy)' : 'Skip duplicates'}
                      </button>
                    ))}
                  </div>
                </div>

                <OptionCard
                  checked={copyFiles}
                  onChange={setCopyFiles}
                  title="Copy uploaded files"
                  description="Duplicate PDFs and videos stored on this server. YouTube links are reused as-is."
                />
                <OptionCard
                  checked={includeVisibility}
                  onChange={setIncludeVisibility}
                  title="Keep visibility settings"
                  description="Import VISIBLE, HIDDEN, and DRAFT states from the source course."
                />
                {sourceHasCurriculum ? (
                  <OptionCard
                    checked={includeTeachers}
                    onChange={setIncludeTeachers}
                    title="Include teacher assignments"
                    description="Only when the teacher is already linked to the target course."
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
          {step === 1 ? (
            <Button
              variant="outline"
              className="ml-auto rounded-xl border-slate-200 font-bold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 font-bold"
                onClick={() => setStep((s) => (s === 2 ? 1 : 2) as Step)}
                disabled={importing}
              >
                Back
              </Button>
              {step === 2 ? (
                <Button
                  className="rounded-xl bg-indigo-600 px-6 font-bold shadow-md shadow-indigo-500/25 hover:bg-indigo-700"
                  disabled={!hasSelection || contentLoading}
                  onClick={() => setStep(3)}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 font-bold shadow-md shadow-indigo-500/30 hover:from-indigo-700 hover:to-violet-700"
                  disabled={importing || !hasSelection}
                  onClick={() => void handleImport()}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Import content
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
