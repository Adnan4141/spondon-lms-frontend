'use client';

import { Toaster } from '@/components/ui/toast';
import { StudentsEnrollmentsPanel } from '@/features/admin/students/components/StudentsEnrollmentsPanel';
import { StudentsListPanel } from '@/features/admin/students/components/StudentsListPanel';
import { StudentsPageModals } from '@/features/admin/students/components/StudentsPageModals';
import { useStudentsPageActions } from '@/features/admin/students/hooks/useStudentsPageActions';
import { useStudentsPageData } from '@/features/admin/students/hooks/useStudentsPageData';

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

  return (
    <>
      <StudentsListPanel data={data} actions={actions} />
      <StudentsPageModals data={data} actions={actions} />
      <Toaster />
    </>
  );
}
