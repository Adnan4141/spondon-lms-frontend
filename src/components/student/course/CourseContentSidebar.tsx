'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Circle } from 'lucide-react';
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
    <div className="space-y-4">
      <h3 className="text-lg font-black text-slate-900">Course content</h3>
      <Card className="rounded-2xl border border-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 pt-4">
            <SubjectTabsOrSelect
              subjects={subjects}
              activeSubject={activeSubject}
              onSubjectChange={onSubjectChange}
            />
          </div>
          {filtered.map((g) => {
            const topicDuration = g.items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
            const isExpanded = expandedTopics.has(g.key);
            const subjectLine = g.subject !== 'Course' ? g.subject : null;
            const chapterLine = g.chapter === 'General' && !subjectLine ? 'Content' : g.chapter;
            const durLabel = topicDuration > 0 ? formatDuration(topicDuration) : '';
            return (
              <div key={g.key} className="border-b border-slate-100 last:border-0">
                <button
                  onClick={() =>
                    setExpandedTopics((prev) => {
                      const next = new Set(prev);
                      if (next.has(g.key)) next.delete(g.key);
                      else next.add(g.key);
                      return next;
                    })
                  }
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex flex-col items-start gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 truncate">{chapterLine}</span>
                    </div>
                    {subjectLine ? (
                      <span className="pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                        {subjectLine}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0">{durLabel}</span>
                </button>
                {isExpanded && (
                  <div className="bg-slate-50/50">
                    {g.items.map((item) => {
                      const isSelected = selectedContentId === item.id;
                      const isCompleted = item.progress?.completed;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onSelectContent(item)}
                          className={`w-full flex items-center gap-3 px-5 py-3 pl-12 hover:bg-white/80 transition-colors text-left ${
                            isSelected ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                          )}
                          <Play className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className={`flex-1 font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {item.title}
                          </span>
                          {item.durationMinutes != null && (
                            <span className="text-xs text-slate-400">{item.durationMinutes} min</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              <p>এই বিষয়ে এখনও কন্টেন্ট নেই।</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
