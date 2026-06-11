'use client';

import type { Dispatch } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import type { ExamProductType } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  courseId: string;
  courses: Course[];
  deliveryMode: 'ONLINE' | 'OFFLINE';
  productType: ExamProductType | '';
  dispatch: Dispatch<WizardFormAction>;
};

export function DeliveryModeCard({ courseId, courses, deliveryMode, productType, dispatch }: Props) {
  if (!productType || !courseId) return null;

  const isOnline = deliveryMode === 'ONLINE';
  const course = courses.find((c) => c.id === courseId);
  const courseTypeLabel = course?.type === 'OFFLINE' ? 'Offline' : 'Online';
  const differsFromCourse = course && course.type !== deliveryMode;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-serif text-base text-[#0D1B35]">Delivery mode</CardTitle>
          <Badge className={isOnline ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription>
          Choose how students take this exam. This is independent of the course type — you can run an online exam on an offline course.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <p className="rounded-md bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
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
      </CardContent>
    </Card>
  );
}
