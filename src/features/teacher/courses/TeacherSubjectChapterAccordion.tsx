'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Clock, FolderOpen, Play, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SubjectGroup } from '@/features/admin/courses/courseTypes';
import type { CourseContent } from '@/types/course-content';
import { TeacherSegmentRow } from './TeacherSegmentRow';
import type { TeacherAddSegmentContext } from './teacher-course-utils';

type Props = {
  subjects: SubjectGroup[];
  canEdit: boolean;
  onAddSegment: (ctx?: TeacherAddSegmentContext) => void;
  onEdit: (item: CourseContent) => void;
  onDelete: (item: CourseContent) => void;
};

function subjectKey(name: string) {
  return `subj::${name}`;
}

function chapterKey(subject: string, chapter: string) {
  return `ch::${subject}::${chapter}`;
}

export function TeacherSubjectChapterAccordion({
  subjects,
  canEdit,
  onAddSegment,
  onEdit,
  onDelete,
}: Props) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(() => new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => new Set());
  const [expansionSeeded, setExpansionSeeded] = useState(false);

  useEffect(() => {
    if (expansionSeeded || subjects.length === 0) return;
    const subs = new Set<string>();
    const chs = new Set<string>();
    if (subjects.length === 1) {
      subs.add(subjectKey(subjects[0].name));
      if (subjects[0].chapters.length === 1) {
        chs.add(chapterKey(subjects[0].name, subjects[0].chapters[0].name));
      }
    }
    setExpandedSubjects(subs);
    setExpandedChapters(chs);
    setExpansionSeeded(true);
  }, [subjects, expansionSeeded]);

  const isSubjectOpen = (name: string) => expandedSubjects.has(subjectKey(name));

  const isChapterOpen = (subject: string, chapter: string) =>
    expandedChapters.has(chapterKey(subject, chapter));

  const toggleSubject = (name: string) => {
    const key = subjectKey(name);
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleChapter = (subject: string, chapter: string) => {
    const key = chapterKey(subject, chapter);
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
          <FolderOpen className="h-7 w-7 text-indigo-500" />
        </div>
        <h3 className="text-base font-bold text-slate-700">No materials yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Add subject, chapter, and segment fields so students see the same structure in their
          portal.
        </p>
        {canEdit ? (
          <Button
            type="button"
            onClick={() => onAddSegment()}
            className="mt-5 gap-2 rounded-xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add first segment
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subjects.map((sub, subIdx) => {
        const subOpen = isSubjectOpen(sub.name);
        const segTotal = sub.chapters.reduce((n, ch) => n + ch.items.length, 0);

        return (
          <div
            key={sub.name}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleSubject(sub.name)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50/80"
            >
              {subOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-indigo-600" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
                  Subject {subIdx + 1}
                  <span className="ml-2 font-bold text-slate-400">
                    · {sub.chapters.length} chapters
                  </span>
                </h4>
                <p className="truncate text-sm font-black text-slate-800">{sub.name}</p>
                <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                  {segTotal} {segTotal === 1 ? 'segment' : 'segments'}
                </p>
              </div>
            </button>

            {subOpen ? (
              <div className="space-y-3 border-t border-slate-50 bg-slate-50/40 p-3">
                {sub.chapters.map((ch, chapterIdx) => {
                  const chKey = chapterKey(sub.name, ch.name);
                  const chOpen = isChapterOpen(sub.name, ch.name);
                  const totalDuration = ch.items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
                  const videoCount = ch.items.filter((i) => i.type === 'VIDEO').length;

                  return (
                    <div
                      key={chKey}
                      className="overflow-hidden rounded-xl border border-slate-100 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => toggleChapter(sub.name, ch.name)}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50/80"
                      >
                        {chOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-900" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-sm font-black text-slate-800">{ch.name}</h5>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400">
                              {ch.items.length} {ch.items.length === 1 ? 'segment' : 'segments'}
                            </span>
                            {videoCount > 0 ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Play className="h-2.5 w-2.5" />
                                {videoCount} video{videoCount !== 1 ? 's' : ''}
                              </span>
                            ) : null}
                            {totalDuration > 0 ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Clock className="h-2.5 w-2.5" />
                                {totalDuration} min
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[8px] font-black uppercase">
                          Ch {chapterIdx + 1}
                        </Badge>
                      </button>

                      {chOpen ? (
                        <div className="border-t border-slate-50">
                          {ch.items.map((item, idx) => (
                            <TeacherSegmentRow
                              key={item.id}
                              item={item}
                              index={idx}
                              canEdit={canEdit}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          ))}
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() =>
                                onAddSegment({
                                  subjectTitle:
                                    sub.name === '(No Subject)' ? '' : sub.name,
                                  chapterTitle:
                                    ch.name === '(No Chapter)' ? '' : ch.name,
                                  topicTitle: ch.name === '(No Chapter)' ? undefined : ch.name,
                                })
                              }
                              className="flex w-full items-center justify-center gap-2 border-t border-dashed border-slate-100 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                              <Plus className="h-3 w-3" />
                              Add segment
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
