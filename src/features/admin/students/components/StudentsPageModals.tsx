'use client';

import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import type { AddStudentSaveMeta } from '@/features/admin/students/modals/AddStudentModal';
import type { StudentsPageActions } from '@/features/admin/students/hooks/useStudentsPageActions';
import type { StudentsPageData } from '@/features/admin/students/hooks/useStudentsPageData';

const AddStudentModal = dynamic(
  () => import('@/features/admin/students/modals/AddStudentModal').then((m) => m.AddStudentModal),
);
const BulkImportStudentsModal = dynamic(
  () =>
    import('@/features/admin/students/modals/BulkImportStudentsModal').then(
      (m) => m.BulkImportStudentsModal,
    ),
);
const EditStudentModal = dynamic(
  () => import('@/features/admin/students/modals/EditStudentModal').then((m) => m.EditStudentModal),
);
const EnrollmentModal = dynamic(
  () => import('@/features/admin/students/enrollment/EnrollmentModal').then((m) => m.EnrollmentModal),
);
const CollectPaymentModal = dynamic(
  () =>
    import('@/features/admin/students/enrollment/CollectPaymentModal').then(
      (m) => m.CollectPaymentModal,
    ),
);

type Props = {
  data: StudentsPageData;
  actions: StudentsPageActions;
};

export function StudentsPageModals({ data, actions }: Props) {
  const { toast } = useToast();
  const { user, branchFilter, programs, allCourses, branches, invalidateStudents } = data;
  const {
    modal,
    editStudent,
    showToast,
    closeModal,
    closeEditStudent,
    handleBulkImportQueued,
    fmt,
    fmtMonth,
  } = actions;

  return (
    <>
      {modal?.type === 'addStudent' && (
        <AddStudentModal
          defaultBranchId={user?.branchId ?? undefined}
          onClose={closeModal}
          onSave={(s, meta?: AddStudentSaveMeta) => {
            void invalidateStudents();
            closeModal();
            if (meta?.oneTimePassword) {
              toast({
                title: `Student ${s.fullName} created`,
                description: `Reg: ${s.regNo}. One-time password: ${meta.oneTimePassword}`,
                variant: 'success',
              });
            } else if (meta?.usedCustomPassword) {
              toast({
                title: `Student ${s.fullName} created`,
                description: `Reg: ${s.regNo}. They can log in with the password you set. Automated SMS credentials do not include custom passwords.`,
                variant: 'success',
              });
            } else {
              showToast(`Student ${s.fullName} created! Reg: ${s.regNo}`, 'success');
            }
          }}
        />
      )}

      {modal?.type === 'bulkImport' && (
        <BulkImportStudentsModal
          branches={branches}
          defaultBranchId={branchFilter !== 'ALL' ? branchFilter : user?.branchId ?? undefined}
          onClose={closeModal}
          onQueued={handleBulkImportQueued}
        />
      )}

      {modal?.type === 'enroll' && modal.student && (
        <EnrollmentModal
          student={modal.student}
          programs={programs}
          allCourses={allCourses}
          branches={branches}
          onClose={closeModal}
          onSave={(enrollmentData) => {
            void invalidateStudents();
            closeModal();
            showToast(`Enrollment confirmed for ${enrollmentData.student.fullName}!`, 'success');
          }}
        />
      )}

      {modal?.type === 'payment' && modal.student && (
        <CollectPaymentModal
          student={modal.student}
          onClose={closeModal}
          onSave={(paymentData) => {
            closeModal();
            showToast(
              `${fmt(paymentData.amount)} collected via ${paymentData.method} for ${fmtMonth(paymentData.month)}`,
              'success',
            );
          }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={closeEditStudent}
          onSave={(updated) => {
            void invalidateStudents();
            closeEditStudent();
            showToast(`${updated.fullName}'s profile updated successfully`, 'success');
          }}
        />
      )}
    </>
  );
}
