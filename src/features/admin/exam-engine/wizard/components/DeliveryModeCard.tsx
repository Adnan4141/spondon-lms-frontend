'use client';

import type { Dispatch } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  courseId: string;
  courses: Course[];
  deliveryMode: 'ONLINE' | 'OFFLINE';
  dispatch: Dispatch<WizardFormAction>;
};

export function DeliveryModeFields({ courseId, courses, deliveryMode, dispatch }: Props) {
  const isOnline = deliveryMode === 'ONLINE';
  const course = courses.find((c) => c.id === courseId);
  const courseTypeLabel = course?.type === 'OFFLINE' ? 'Offline' : 'Online';
  const differsFromCourse = course && course.type !== deliveryMode;

  return (
    <div className="md:col-span-2 space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Delivery mode</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            How students take this exam — independent of course type.
          </p>
        </div>
        <Badge className={isOnline ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <div className="flex gap-2">
        {(['ONLINE', 'OFFLINE'] as const).map((mode) => {
          const active = deliveryMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => dispatch({ type: 'SET_DELIVERY_MODE', deliveryMode: mode })}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                active
                  ? mode === 'ONLINE'
                    ? 'border-sky-300 bg-sky-50 text-sky-900'
                    : 'border-orange-300 bg-orange-50 text-orange-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <span className="font-medium">{mode === 'ONLINE' ? 'Online' : 'Offline'}</span>
              <span className="mt-0.5 block text-[11px] opacity-80">
                {mode === 'ONLINE'
                  ? 'Students take the exam digitally'
                  : 'Paper-based exam with OMR or manual entry'}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        {isOnline
          ? 'Online delivery — automatic grading and auto-submit on disconnect are available.'
          : 'Offline delivery — OMR scan, manual entry, and Excel upload are available.'}
        {differsFromCourse ? (
          <>
            {' '}
            <span className="text-amber-700">
              Note: linked course is {courseTypeLabel}, but this exam is set to {isOnline ? 'Online' : 'Offline'}.
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
