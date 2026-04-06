'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { BookSubjectSelector } from './BookSubjectSelector';
import { BookChapterAccordion } from './BookChapterAccordion';
import type { BookContentOutline } from '@/lib/api/books';

interface BookContentsSectionProps {
  outline: BookContentOutline | undefined;
}

export function BookContentsSection({ outline }: BookContentsSectionProps) {
  const subjects = outline?.subjects ?? [];
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (subjects.length && !activeSubjectId) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) ?? subjects[0] ?? null,
    [subjects, activeSubjectId],
  );

  const chapters = activeSubject?.chapters ?? [];

  useEffect(() => {
    if (chapters.length) {
      setExpanded(new Set([chapters[0].id]));
    } else {
      setExpanded(new Set());
    }
  }, [activeSubjectId]);

  const toggle = (chapterId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  if (!subjects.length) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50">
           <BookOpen className="h-10 w-10 text-slate-200" />
        </div>
        <p className="text-xl font-black text-slate-800">কন্টেন্ট পাওয়া যায়নি</p>
        <p className="mt-2 text-slate-500 font-medium max-w-xs mx-auto">এই বইয়ের জন্য এখনও কোনো কোর্স কন্টেন্ট বা রিসোর্স যুক্ত করা হয়নি।</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4">
      <div className="space-y-4">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">বিষয় নির্বাচন করুন</h4>
         <BookSubjectSelector
          subjects={subjects}
          activeSubjectId={activeSubject?.id ?? null}
          onSubjectChange={(id) => setActiveSubjectId(id)}
        />
      </div>
      <div className="space-y-4">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">অধ্যায়সমূহ</h4>
         <BookChapterAccordion chapters={chapters} expanded={expanded} onToggle={toggle} />
      </div>
    </div>
  );
}
