"use client";

import { EnrollmentForm } from "./EnrollmentForm";

interface AddEnrollmentFormProps {
  studentId: string;
  defaultBranchId?: string;
  onSuccess: () => Promise<void>;
  /**
   * When embedded in EditStudentWizard, parent owns steps 2–4 (Register is step 1 on parent).
   * Parent parentStep: 2 = courses, 3 = payment, 4 = confirm.
   */
  nestedInParentWizard?: {
    parentStep: number;
    setParentStep: (step: number) => void;
    onBackToProfile: () => void;
  };
}

export function AddEnrollmentForm({
  studentId,
  defaultBranchId,
  onSuccess,
  nestedInParentWizard,
}: AddEnrollmentFormProps) {
  return (
    <EnrollmentForm
      studentId={studentId}
      defaultBranchId={defaultBranchId}
      onSuccess={onSuccess}
      nestedInParentWizard={nestedInParentWizard}
    />
  );
}
