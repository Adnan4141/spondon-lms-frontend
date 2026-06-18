'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronDown,
  Play,
  CheckCircle2,
  Circle,
  FileText,
  Link2,
  ClipboardList,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubjectTabsOrSelect } from './SubjectTabsOrSelect';
import type { SubjectChapterGroup } from '@/lib/course-outline';

export type SidebarContentItem = {
  id: string;
  type: string;
  title: string;
  fileUrl?: string;
  sortOrder: number;
  durationMinutes?: number;
  progress?: { completed: boolean; progressPercent?: number } | null;
};

function ContentTypeIcon({ type, isSelected }: { type: string; isSelected: boolean }) {
  const cls = cn(
    'h-[14px] w-[14px] shrink-0 transition-colors',
    isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-655'
  );
  switch (type) {
    case 'VIDEO':
      return <Play className={cls} fill={isSelected ? 'currentColor' : 'none'} strokeWidth={2.5} />;
    case 'PDF':
    case 'NOTE':
    case 'SAMPLE':
    case 'SYLLABUS':
    case 'LEAFLET':
      return <FileText className={cls} strokeWidth={2.2} />;
    case 'QUIZ':
    case 'ASSIGNMENT':
      return <ClipboardList className={cls} strokeWidth={2.2} />;
    case 'LIVE':
      return <Radio className={cls} strokeWidth={2.2} />;
    case 'LINK':
      return <Link2 className={cls} strokeWidth={2.2} />;
    default:
      return <FileText className={cls} strokeWidth={2.2} />;
  }
}

interface CourseContentSidebarProps {
  groups: SubjectChapterGroup<SidebarContentItem>[];
  subjects: string[];
  activeSubject: string;
  onSubjectChange: (subject: string) => void;
  expandedTopics: Set<string>;
  setExpandedTopics: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedContentId: string | null;
  onSelectContent: (item: SidebarContentItem) => void;
  formatDuration: (min: number) => string;
  loading: boolean;
}

export function CourseContentSidebar({
  groups,
  subjects,
  activeSubject,
  onSubjectChange,
  expandedTopics,
  setExpandedTopics,
  selectedContentId,
  onSelectContent,
  formatDuration,
  loading,
}: CourseContentSidebarProps) {
  const filtered = groups.filter((g) => g.subject === activeSubject);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-black tracking-tight text-slate-800">Course Content</h3>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10.5px] font-bold text-indigo-600 border border-indigo-100">
          {filtered.length} Chapters
        </span>
      </div>

      <Card className="rounded-2xl border border-slate-200/60 overflow-hidden bg-white shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
        <CardContent className="p-0">
          {subjects.length > 1 && (
            <div className="px-4.5 pt-4.5 pb-2">
              <SubjectTabsOrSelect
                subjects={subjects}
                activeSubject={activeSubject}
                onSubjectChange={onSubjectChange}
              />
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {filtered.map((g) => {
              const topicDuration = g.items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
              const isExpanded = expandedTopics.has(g.key);
              const subjectLine = g.subject !== 'Course' ? g.subject : null;
              const chapterLine = g.chapter === 'General' && !subjectLine ? 'Content' : g.chapter;
              const durLabel = topicDuration > 0 ? formatDuration(topicDuration) : '';

              return (
                <div key={g.key} className="group/chapter overflow-hidden transition-all">
                  <button
                    onClick={() =>
                      setExpandedTopics((prev) => {
                        const next = new Set(prev);
                        if (next.has(g.key)) next.delete(g.key);
                        else next.add(g.key);
                        return next;
                      })
                    }
                    className={cn(
                      'w-full flex items-center justify-between px-5 py-4 transition-all text-left',
                      isExpanded ? 'bg-slate-50/70 hover:bg-slate-100/40' : 'hover:bg-slate-50/60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md transition-all duration-250',
                          isExpanded ? 'rotate-0 text-indigo-600 bg-indigo-50' : '-rotate-90 text-slate-400 bg-slate-100'
                        )}
                      >
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.75} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 text-[13.5px] leading-snug truncate block">
                          {chapterLine}
                        </span>
                        {subjectLine && (
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 truncate block mt-0.5">
                            {subjectLine}
                          </span>
                        )}
                      </div>
                    </div>
                    {durLabel && (
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {durLabel}
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-50/20 border-t border-slate-100/70 divide-y divide-slate-100/50">
                      {g.items.map((item) => {
                        const isSelected = selectedContentId === item.id;
                        const isCompleted = item.progress?.completed;

                        return (
                          <button
                            key={item.id}
                            onClick={() => onSelectContent(item)}
                            className={cn(
                              'group/item relative w-full flex items-center gap-3 px-5 py-3.5 pl-12 transition-all text-left',
                              isSelected
                                ? 'bg-indigo-50/60 text-indigo-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-600'
                            )}
                          >
                            {isSelected && (
                              <span className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-650 bg-indigo-600 rounded-r-full" />
                            )}

                            <div className="shrink-0 flex items-center justify-center">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" strokeWidth={2.5} />
                              ) : (
                                <Circle
                                  className={cn(
                                    'h-4.5 w-4.5 transition-colors',
                                    isSelected ? 'text-indigo-400' : 'text-slate-350 text-slate-300 group-hover/item:text-slate-400'
                                  )}
                                  strokeWidth={2.25}
                                />
                              )}
                            </div>

                            <ContentTypeIcon type={item.type} isSelected={isSelected} />

                            <span
                              className={cn(
                                'flex-1 text-[13px] tracking-tight leading-snug truncate',
                                isSelected
                                  ? 'font-extrabold text-indigo-950'
                                  : 'font-semibold text-slate-655 text-slate-600 group-hover/item:text-slate-900'
                              )}
                            >
                              {item.title}
                            </span>

                            {item.durationMinutes != null && item.durationMinutes > 0 && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-1.5 py-0.5 rounded-md group-hover/item:bg-white transition-colors border border-slate-200/30">
                                {item.durationMinutes}m
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-semibold">No contents available for this subject.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
