'use client';

import { AlertTriangle } from 'lucide-react';
import type { CourseFormProps } from './course-form-types';
import { useCourseForm } from '../hooks/useCourseForm';
import { CourseFormHeader } from './CourseFormHeader';
import { CourseFormBasicTab } from './CourseFormBasicTab';
import { CourseFormContentTab } from './CourseFormContentTab';
import { CourseFormRelatedTab } from './CourseFormRelatedTab';
import { CourseFormFooter } from './CourseFormFooter';
import { CourseFormRenameDialog } from './CourseFormRenameDialog';

export function CourseForm({ programs, course, onSuccess }: CourseFormProps) {
  const ctrl = useCourseForm({ programs, course, onSuccess });

  return (
    <div className="flex flex-col h-[88vh] bg-[#f8f8fa] text-slate-900 overflow-hidden">
      <CourseFormHeader ctrl={ctrl} />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-5">
        {ctrl.activeTab === 'basic' && <CourseFormBasicTab ctrl={ctrl} />}
        {ctrl.activeTab === 'content' && <CourseFormContentTab ctrl={ctrl} />}
        {ctrl.activeTab === 'related' && <CourseFormRelatedTab ctrl={ctrl} />}

        {ctrl.error && (
          <div className="max-w-3xl mx-auto flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-rose-700">{ctrl.error}</p>
          </div>
        )}
      </div>

      <CourseFormFooter ctrl={ctrl} />
      <CourseFormRenameDialog ctrl={ctrl} />
    </div>
  );
}
