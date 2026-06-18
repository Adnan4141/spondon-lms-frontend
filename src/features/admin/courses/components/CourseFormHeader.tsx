'use client';

import { Info, FileUp, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CourseFormController, CourseFormTab } from '../hooks/useCourseForm';

const tabs = [
  { id: 'basic' as const, label: 'Basic Info', icon: Info, disabled: false },
  { id: 'content' as const, label: 'Course Content', icon: FileUp, disabled: false },
  { id: 'related' as const, label: 'Related Courses', icon: Link2, disabled: false },
];

export function CourseFormHeader({ ctrl }: { ctrl: CourseFormController }) {
  const { isEdit, course, activeTab, setActiveTab } = ctrl;

  return (
    <div className="shrink-0 bg-white border-b border-slate-100 px-6 pt-5 pb-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h2>
          {isEdit && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{course?.name}</p>
          )}
        </div>
        {isEdit && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1',
              course?.status === 'ACTIVE'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : course?.status === 'DISABLED'
                  ? 'border-amber-200 bg-amber-50 text-amber-600'
                  : 'border-slate-200 bg-slate-50 text-slate-500',
            )}
          >
            {course?.status}
          </Badge>
        )}
      </div>

      <div className="flex gap-0">
        {tabs.map((tab) => {
          const disabled = tab.id !== 'basic' && !isEdit;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(tab.id as CourseFormTab)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-all border-b-2',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
                disabled && 'opacity-30 cursor-not-allowed pointer-events-none',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
