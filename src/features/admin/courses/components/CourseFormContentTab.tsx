'use client';

import { confirmAction } from '@/features/admin/shared/confirm-action';
import { deleteCourseContent } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  Pencil,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseResourceForm } from './CourseResourceForm';
import { getResourceIcon } from './course-form-content-utils';
import type { CourseFormController } from '../hooks/useCourseForm';

export function CourseFormContentTab({ ctrl }: { ctrl: CourseFormController }) {
  const {
    course,
    contentBySubject,
    showResourceForm,
    setShowResourceForm,
    editingResource,
    setEditingResource,
    addingToChapter,
    setAddingToChapter,
    addingChapterOrder,
    setAddingChapterOrder,
    addingSubjectTitle,
    setAddingSubjectTitle,
    subjectRenaming,
    fetchExtras,
    isSubjectOpen,
    toggleSubject,
    isChapterOpen,
    toggleChapter,
    startRename,
    closeResourceForm,
    openNewChapter,
  } = ctrl;

  if (!course) return null;

  const hasCurriculum = (course.curriculumNodeCount ?? 0) > 0;

  return (
          <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-200">
            {hasCurriculum ? (
              <div className="flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3.5">
                <Layers className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-indigo-900">Curriculum builder active</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-indigo-700/80">
                    This course uses the curriculum tree (subjects → chapters → lessons). Manage it from{' '}
                    <span className="font-semibold">Courses → select course → Content</span> — the same structure students see.
                  </p>
                </div>
              </div>
            ) : null}

            {!hasCurriculum ? (
              <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Subjects & Lessons</h3>
              <Button
                onClick={() => {
                  setEditingResource(null);
                  setAddingToChapter(null);
                  setAddingChapterOrder(null);
                  setAddingSubjectTitle(null);
                  setShowResourceForm(true);
                }}
                size="sm"
                className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Subject
              </Button>
            </div>

            {/* Content form dialog */}
            <Dialog
              open={showResourceForm}
              onOpenChange={(open) => {
                if (!open) {
                  setShowResourceForm(false);
                  setEditingResource(null);
                  setAddingToChapter(null);
                  setAddingChapterOrder(null);
                  setAddingSubjectTitle(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                  <DialogTitle className="text-base font-bold">
                    {editingResource
                      ? 'Edit Segment'
                      : addingToChapter
                        ? 'Add segment to chapter'
                        : 'Add new content'}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 pt-4">
                  <CourseResourceForm
                    key={`${course.id}-${editingResource?.id ?? 'new'}-${addingToChapter ?? 'root'}-${addingSubjectTitle ?? ''}`}
                    courseId={course.id}
                    resource={editingResource}
                    defaultSubjectTitle={
                      addingSubjectTitle != null
                        ? addingSubjectTitle || undefined
                        : addingToChapter
                          ? (() => {
                              const s = addingToChapter.split(':::')[0];
                              return s === 'General' ? '' : s;
                            })()
                          : undefined
                    }
                    defaultChapterTitle={
                      addingToChapter
                        ? (() => {
                            const p = addingToChapter.split(':::');
                            const c = p[1] || '';
                            return c === 'Ungrouped' ? '' : c;
                          })()
                        : undefined
                    }
                    defaultTopicTitle={undefined}
                    defaultTopicSortOrder={addingChapterOrder ?? undefined}
                    onSuccess={() => {
                      setShowResourceForm(false);
                      setEditingResource(null);
                      setAddingToChapter(null);
                      setAddingChapterOrder(null);
                      setAddingSubjectTitle(null);
                      fetchExtras();
                    }}
                    onCancel={() => {
                      setShowResourceForm(false);
                      setEditingResource(null);
                      setAddingToChapter(null);
                      setAddingChapterOrder(null);
                      setAddingSubjectTitle(null);
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {contentBySubject.sortedChapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-300">
                <FileText className="h-10 w-10 mb-3" />
                <p className="text-sm font-semibold">No content yet</p>
                <p className="text-xs mt-1">Click &quot;Add Subject&quot; to start building your course</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contentBySubject.orderedSubjects.map(([subjectTitle, chapterRows]) => {
                  const subjectKey = subjectTitle;
                  const subOpen = isSubjectOpen(subjectKey);
                  const segCount = chapterRows.reduce((n, [, items]) => n + items.length, 0);
                  const displaySubject =
                    subjectTitle === 'General' ? 'General (no subject)' : subjectTitle;

                  return (
                    <div
                      key={subjectKey}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                    >
                      {/* Subject header */}
                      <div className="flex items-center gap-0 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleSubject(subjectKey)}
                          className="flex flex-1 items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors min-w-0"
                        >
                          <div
                            className={cn(
                              'h-5 w-5 rounded-md flex items-center justify-center transition-colors shrink-0',
                              subOpen
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-slate-100 text-slate-400',
                            )}
                          >
                            {subOpen ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {displaySubject}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-bold uppercase shrink-0"
                              >
                                Subject
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {chapterRows.length} chapters · {segCount} segments
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingResource(null);
                              setAddingToChapter(null);
                              setAddingChapterOrder(null);
                              setAddingSubjectTitle(
                                subjectTitle === 'General' ? '' : subjectTitle,
                              );
                              setShowResourceForm(true);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Chapter
                          </button>
                          <button
                            type="button"
                            disabled={subjectRenaming}
                            onClick={() => startRename(subjectTitle)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                          >
                            <Pencil className="h-3 w-3" /> Rename
                          </button>
                        </div>
                      </div>

                      {/* Chapters */}
                      {subOpen && (
                        <div className="divide-y divide-slate-50 bg-slate-50/50">
                          {chapterRows.map(([compoundKey, items], chapterIdx) => {
                            const isExpanded = isChapterOpen(compoundKey);
                            const totalDuration = items.reduce(
                              (sum, r) => sum + (r.durationMinutes || 0),
                              0,
                            );
                            const videoCount = items.filter((r: any) => r.type === 'VIDEO').length;
                            const chapterOrder = items[0]?.topicSortOrder ?? chapterIdx;
                            const chapterPart = compoundKey.split(':::')[1] || 'Ungrouped';
                            const chapterHeading =
                              chapterPart === 'Ungrouped' && subjectTitle === 'General'
                                ? 'General content'
                                : chapterPart === 'Ungrouped'
                                  ? 'General'
                                  : chapterPart;

                            return (
                              <div key={compoundKey} className="bg-white mx-3 my-2 rounded-xl border border-slate-100 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleChapter(compoundKey)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 truncate">
                                      {chapterHeading}
                                    </p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-slate-400">
                                        {items.length} segments
                                      </span>
                                      {videoCount > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Play className="h-2.5 w-2.5" /> {videoCount} video
                                          {videoCount !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {totalDuration > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Clock className="h-2.5 w-2.5" /> {totalDuration} min
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                                    Ch {chapterIdx + 1}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="border-t border-slate-50">
                                    {items
                                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                      .map((res, idx) => (
                                        <div
                                          key={res.id}
                                          className="group flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-b-0 hover:bg-indigo-50/30 transition-colors"
                                        >
                                          <span className="w-5 shrink-0 text-center text-[10px] font-bold text-slate-300">
                                            {String(idx + 1).padStart(2, '0')}
                                          </span>
                                          <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors">
                                            {getResourceIcon(res.type)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-slate-700 truncate">
                                              {res.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                                                {res.type}
                                              </span>
                                              {res.isFree && (
                                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-600">
                                                  Free
                                                </span>
                                              )}
                                              {res.durationMinutes > 0 && (
                                                <span className="text-[10px] text-slate-400">
                                                  {res.durationMinutes} min
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                              type="button"
                                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:border-amber-200 hover:bg-amber-50 transition-colors"
                                              onClick={() => {
                                                setEditingResource(res);
                                                setAddingToChapter(null);
                                                setShowResourceForm(true);
                                              }}
                                            >
                                              <Pencil className="h-3 w-3 text-amber-500" />
                                            </button>
                                            <button
                                              type="button"
                                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:border-rose-200 hover:bg-rose-50 transition-colors"
                                              onClick={async () => {
                                                if (!(await confirmAction({
                                                  title: 'Delete segment?',
                                                  description: 'This segment will be permanently removed.',
                                                  confirmLabel: 'Delete segment',
                                                  variant: 'danger',
                                                }))) {
                                                  return;
                                                }
                                                await deleteCourseContent(res.id);
                                                fetchExtras();
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3 text-rose-400" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingResource(null);
                                        setAddingToChapter(compoundKey);
                                        setAddingChapterOrder(chapterOrder);
                                        setShowResourceForm(true);
                                      }}
                                      className="flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors border-t border-dashed border-slate-100"
                                    >
                                      <Plus className="h-3 w-3" /> Add Segment
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
              </>
            ) : null}
          </div>
  );
}
