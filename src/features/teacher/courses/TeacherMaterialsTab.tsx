'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SubjectGroup } from '@/features/admin/courses/courseTypes';
import type { CourseContent } from '@/types/course-content';
import { TeacherSubjectChapterAccordion } from './TeacherSubjectChapterAccordion';
import type { TeacherAddSegmentContext } from './teacher-course-utils';

type Props = {
  subjects: SubjectGroup[];
  segmentCount: number;
  canEdit: boolean;
  onAddSegment: (ctx?: TeacherAddSegmentContext) => void;
  onEdit: (item: CourseContent) => void;
  onDelete: (item: CourseContent) => void;
};

export function TeacherMaterialsTab({
  subjects,
  segmentCount,
  canEdit,
  onAddSegment,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-slate-700">
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-indigo-900">
          কোর্স → বিষয় → অধ্যায় → সেগমেন্ট
        </p>
        <p className="leading-relaxed">
          Use <strong className="text-slate-900">Subject</strong> and{' '}
          <strong className="text-slate-900">Chapter</strong> when adding segments — students see
          the same structure in their course portal.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 sm:text-xl">Course materials</h2>
          <p className="text-sm font-medium text-slate-500">
            {segmentCount > 0
              ? `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} · ${segmentCount} segment${segmentCount !== 1 ? 's' : ''}`
              : 'No segments published yet'}
            {!canEdit ? ' · View only' : ''}
          </p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            onClick={() => onAddSegment()}
            variant="secondary"
            className="h-10 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add segment
          </Button>
        ) : null}
      </div>

      <TeacherSubjectChapterAccordion
        subjects={subjects}
        canEdit={canEdit}
        onAddSegment={onAddSegment}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
