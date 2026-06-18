'use client';

import { Button } from '@/components/ui/button';
import type { CourseFormController } from '../hooks/useCourseForm';

export function CourseFormFooter({ ctrl }: { ctrl: CourseFormController }) {
  const { isEdit, submitting, closeModal, handleSubmit } = ctrl;

  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
      <div className="max-w-3xl mx-auto flex gap-3">
        <Button
          variant="outline"
          onClick={closeModal}
          className="flex-1 h-11 rounded-xl border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-[2] h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-200"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving…
            </span>
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Create Course'
          )}
        </Button>
      </div>
    </div>
  );
}
