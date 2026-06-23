'use client';

import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import type { ManageOneTimeEnrollmentModalProps } from './manage-one-time-enrollment-utils';
import { useManageOneTimeEnrollment } from './hooks/useManageOneTimeEnrollment';
import { ManageOneTimeSelectStep } from './ManageOneTimeSelectStep';
import { ManageOneTimeSuccessStep } from './ManageOneTimeSuccessStep';

export function ManageOneTimeEnrollmentModal(props: ManageOneTimeEnrollmentModalProps) {
  const { onClose } = props;
  const ctrl = useManageOneTimeEnrollment(props);

  return (
    <AppModal
      open
      onClose={ctrl.saving ? () => undefined : onClose}
      title="Manage One-Time Courses"
      subtitle={`Program: ${ctrl.program?.name ?? ''}`}
      maxWidth="max-w-5xl"
    >
      {ctrl.step === 'select' && <ManageOneTimeSelectStep ctrl={ctrl} />}
      {ctrl.step === 'success' && <ManageOneTimeSuccessStep ctrl={ctrl} />}
    </AppModal>
  );
}

export type { ManageOneTimeEnrollmentModalProps } from './manage-one-time-enrollment-utils';
