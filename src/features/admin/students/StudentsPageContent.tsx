'use client';

import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/toast';
import { StudentsListPanel } from '@/features/admin/students/components/StudentsListPanel';
import { useStudentsPageActions } from '@/features/admin/students/hooks/useStudentsPageActions';
import { useStudentsPageData } from '@/features/admin/students/hooks/useStudentsPageData';

const StudentsEnrollmentsPanel = dynamic(
  () =>
    import('@/features/admin/students/components/StudentsEnrollmentsPanel').then(
      (m) => m.StudentsEnrollmentsPanel,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center bg-slate-50/50 p-6 text-sm font-medium text-slate-400">
        Loading enrollments…
      </div>
    ),
  },
);

const StudentsPageModals = dynamic(
  () =>
    import('@/features/admin/students/components/StudentsPageModals').then(
      (m) => m.StudentsPageModals,
    ),
);

export function StudentsPageContent() {
  const data = useStudentsPageData();
  const actions = useStudentsPageActions(data);

  if (data.view === 'enrollments') {
    return (
      <StudentsEnrollmentsPanel
        regNo={data.regNo}
        loading={data.enrollmentsLoading}
        student={data.enrollmentsStudent}
        programs={data.programs}
        allCourses={data.allCourses}
        branches={data.branches}
        onBack={actions.closeEnrollments}
        showToast={actions.showToast}
      />
    );
  }

  const showModals = actions.modal !== null || actions.editStudent !== null;

  return (
    <>
      <StudentsListPanel data={data} actions={actions} />
      {showModals ? <StudentsPageModals data={data} actions={actions} /> : null}
      <Toaster />
    </>
  );
}
