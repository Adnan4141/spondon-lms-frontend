'use client';

import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import type { EnrollmentModalProps } from './enrollment-modal-types';
import { useEnrollmentModal } from './hooks/useEnrollmentModal';
import { EnrollmentModalStepTabs } from './EnrollmentModalStepTabs';
import { EnrollmentModalStep1 } from './EnrollmentModalStep1';
import { EnrollmentModalStep2 } from './EnrollmentModalStep2';

export function EnrollmentModal(props: EnrollmentModalProps) {
  const { student, onClose } = props;
  const ctrl = useEnrollmentModal(props);

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Enrollment — ${student.fullName}`}
      subtitle={`Reg: ${student.regNo}`}
      maxWidth="max-w-6xl"
    >
      <EnrollmentModalStepTabs ctrl={ctrl} />
      {ctrl.step === 1 && <EnrollmentModalStep1 ctrl={ctrl} />}
      {ctrl.step === 2 && <EnrollmentModalStep2 ctrl={ctrl} />}
    </AppModal>
  );
}

export type { EnrollmentModalProps } from './enrollment-modal-types';
