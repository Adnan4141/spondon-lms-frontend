'use client';

import { confirmAction } from '@/features/admin/shared/confirm-action';
import { deleteAssociatedCourse } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { CourseAssociationForm } from '../forms/CourseAssociationForm';
import { SectionCard } from './course-form-ui';
import type { CourseFormController } from '../hooks/useCourseForm';

export function CourseFormRelatedTab({ ctrl }: { ctrl: CourseFormController }) {
  const {
    course,
    associations,
    allCourses,
    showAssociationForm,
    setShowAssociationForm,
    fetchExtras,
  } = ctrl;

  if (!course) return null;

  return (
          <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Related Courses</h3>
              {!showAssociationForm && (
                <Button
                  onClick={() => setShowAssociationForm(true)}
                  size="sm"
                  className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Related
                </Button>
              )}
            </div>

            {showAssociationForm && (
              <SectionCard>
                <CourseAssociationForm
                  fromCourseId={course.id}
                  courses={allCourses}
                  onSuccess={() => {
                    setShowAssociationForm(false);
                    fetchExtras();
                  }}
                  onCancel={() => setShowAssociationForm(false)}
                />
              </SectionCard>
            )}

            {associations.length === 0 && !showAssociationForm ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-slate-300">
                <Link2 className="h-10 w-10 mb-3" />
                <p className="text-sm font-semibold">No related courses</p>
                <p className="text-xs mt-1">Link related courses to help students discover more</p>
              </div>
            ) : (
              <div className="space-y-2">
                {associations.map((assoc) => (
                  <div
                    key={assoc.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {assoc.type.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {assoc.toCourse?.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {assoc.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg border border-slate-100 bg-white text-slate-300 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-400 flex items-center justify-center transition-colors"
                      onClick={async () => {
                        if (!(await confirmAction({
                          title: 'Remove related course?',
                          description: 'This association will be removed from the course.',
                          confirmLabel: 'Remove association',
                          variant: 'danger',
                        }))) {
                          return;
                        }
                        await deleteAssociatedCourse(assoc.id);
                        fetchExtras();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
  );
}
