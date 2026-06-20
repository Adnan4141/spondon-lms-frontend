'use client';

import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/toast';
import type { AddStudentSaveMeta } from '@/features/admin/students/modals/AddStudentModal';
import type { StudentsPageActions } from '@/features/admin/students/hooks/useStudentsPageActions';
import type { StudentsPageData } from '@/features/admin/students/hooks/useStudentsPageData';

const EnrolledCoursesView = dynamic(
  () =>
    import('@/features/admin/students/enrollment/EnrolledCoursesView').then(
      (m) => m.EnrolledCoursesView,
    ),
);

type Props = {
  regNo: string;
  loading: boolean;
  student: StudentsPageData['enrollmentsStudent'];
  programs: StudentsPageData['programs'];
  allCourses: StudentsPageData['allCourses'];
  branches: StudentsPageData['branches'];
  onBack: StudentsPageActions['closeEnrollments'];
  showToast: StudentsPageActions['showToast'];
};

export function StudentsEnrollmentsPanel({
  regNo,
  loading,
  student,
  programs,
  allCourses,
  branches,
  onBack,
  showToast,
}: Props) {
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-slate-50/50 p-6 text-sm font-medium text-slate-400">
        Loading enrollments…
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-slate-50/50 p-6">
        <p className="text-sm font-semibold text-slate-600">Student not found — Reg: {regNo}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Back to students list
        </button>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50/50">
      <EnrolledCoursesView
        student={student}
        onBack={onBack}
        showToast={showToast}
        programs={programs}
        allCourses={allCourses}
        branches={branches}
      />
      <Toaster />
    </div>
  );
}
