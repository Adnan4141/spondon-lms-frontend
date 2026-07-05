'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileDown,
  GraduationCap,
  Layers,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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

function StatsPills({ stats }: { stats: ImportSelectionStats }) {
  const items = [
    { label: 'Subjects', val: stats.subjects, icon: BookOpen },
    { label: 'Chapters', val: stats.chapters, icon: Layers },
    { label: 'Lessons', val: stats.lessons, icon: GraduationCap },
    { label: 'Resources', val: stats.resources, icon: FileDown },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ label, val, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
        >
          <Icon className="h-3 w-3 text-indigo-500" />
          {val} {label.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

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

  const typeLabel =
    node.type === 'SUBJECT' ? 'Subject' : node.type === 'CHAPTER' ? 'Chapter' : 'Lesson';
  const meta =
    node.type === 'LESSON'
      ? `${node.resources?.length ?? node.resourceCount ?? 0} resource(s)`
      : node.type === 'CHAPTER'
        ? `${node.children?.length ?? 0} lesson(s)`
        : `${node.children?.length ?? 0} chapter(s)`;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50',
          depth > 0 && 'ml-4',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Checkbox
          checked={fullySelected}
          onCheckedChange={(v) => onToggleSelect(node, v === true)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{node.title}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {typeLabel} · {meta}
          </p>
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
        return (
          <div key={subjectKey}>
            <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
              <button
                type="button"
                onClick={() => onToggleExpand(subjectKey)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
              >
                {subOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              <Checkbox
                checked={isLegacySubjectFullySelected(subject, selectedIds)}
                onCheckedChange={(v) => onToggleSubject(subject, v === true)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{subject.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Subject · {subject.chapters.length} chapter(s)
                </p>
              </div>
            </div>
            {subOpen
              ? subject.chapters.map((chapter) => {
                  const chapterKey = `chap:${subject.name}:::${chapter.name}`;
                  const chapOpen = expanded.has(chapterKey);
                  return (
                    <div key={chapterKey} className="ml-6">
                      <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => onToggleExpand(chapterKey)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                        >
                          {chapOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <Checkbox
                          checked={isLegacyChapterFullySelected(chapter, selectedIds)}
                          onCheckedChange={(v) => onToggleChapter(chapter, v === true)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-700">{chapter.name}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            Chapter · {chapter.items.length} lesson(s)
                          </p>
                        </div>
                      </div>
                      {chapOpen
                        ? chapter.items.map((item) => (
                            <div
                              key={item.id}
                              className="ml-10 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
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
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-bold">Import from another course</DialogTitle>
          <DialogDescription className="text-xs">
            Copy subjects, chapters, lessons, and resources into{' '}
            <span className="font-semibold text-slate-700">{targetCourseName}</span>.
          </DialogDescription>
          <div className="mt-3 flex gap-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-wide',
                  step === s
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : step > s
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-400',
                )}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : <span>{s}</span>}
                {s === 1 ? 'Source' : s === 2 ? 'Select' : 'Confirm'}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                  placeholder="Search courses by name or slug…"
                  className="pl-9 rounded-xl"
                />
              </div>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredCourses.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-400">No courses found.</p>
              ) : (
                <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1">
                  {filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleSelectSource(course)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-indigo-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <BookOpen className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{course.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {course.slug}
                          {(course.curriculumNodeCount ?? 0) > 0
                            ? ' · Curriculum'
                            : ' · Legacy content'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</p>
                <p className="text-sm font-semibold text-slate-800">{sourceCourseName}</p>
              </div>

              {contentLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sourceHasCurriculum && curriculumTree.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  This course has no curriculum content to import.
                </div>
              ) : !sourceHasCurriculum && legacySubjects.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  This course has no content rows to import.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <StatsPills stats={selectionStats} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg text-xs"
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
                  <div className="max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 p-2">
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
                    <p className="text-[11px] text-slate-400">
                      Legacy content will be converted to curriculum (subjects → chapters → lessons) on import.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <p className="text-sm font-bold text-indigo-900">Import summary</p>
                <div className="grid gap-2 text-sm text-indigo-800">
                  <p>
                    <span className="text-indigo-600">From:</span> {sourceCourseName}
                  </p>
                  <p>
                    <span className="text-indigo-600">To:</span> {targetCourseName}
                  </p>
                </div>
                <StatsPills stats={selectionStats} />
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Options</p>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">If name already exists</Label>
                  <div className="flex gap-2">
                    {(['RENAME', 'SKIP'] as ImportConflictStrategy[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setConflictStrategy(v)}
                        className={cn(
                          'flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-colors',
                          conflictStrategy === v
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                        )}
                      >
                        {v === 'RENAME' ? 'Rename (Copy)' : 'Skip'}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                  <Checkbox checked={copyFiles} onCheckedChange={(v) => setCopyFiles(v === true)} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Copy uploaded files</p>
                    <p className="text-[11px] text-slate-400">
                      Duplicate PDFs/videos stored on this server. YouTube and external links are reused as-is.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                  <Checkbox
                    checked={includeVisibility}
                    onCheckedChange={(v) => setIncludeVisibility(v === true)}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Keep visibility settings</p>
                    <p className="text-[11px] text-slate-400">Import VISIBLE / HIDDEN / DRAFT states from source.</p>
                  </div>
                </label>

                {sourceHasCurriculum ? (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <Checkbox
                      checked={includeTeachers}
                      onCheckedChange={(v) => setIncludeTeachers(v === true)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Include teacher assignments</p>
                      <p className="text-[11px] text-slate-400">
                        Only when the teacher is already linked to the target course.
                      </p>
                    </div>
                  </label>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          {step === 1 ? (
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setStep((s) => (s === 2 ? 1 : 2) as Step)}
                disabled={importing}
              >
                Back
              </Button>
              {step === 2 ? (
                <Button
                  className="rounded-xl"
                  disabled={!hasSelection || contentLoading}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  className="rounded-xl"
                  disabled={importing || !hasSelection}
                  onClick={() => void handleImport()}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    'Import content'
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
