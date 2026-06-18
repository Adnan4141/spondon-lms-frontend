'use client';

import { Toaster } from '@/components/ui/toast';
import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import type { ManageEnrollmentModalProps } from './manage-enrollment-modal-utils';
import { useManageEnrollmentModal } from './hooks/useManageEnrollmentModal';
import { ManageEnrollmentSelectStep } from './ManageEnrollmentSelectStep';
import { ManageEnrollmentSuccessStep } from './ManageEnrollmentSuccessStep';
import { DiscountAdjustmentPanel } from './DiscountAdjustmentPanel';

export function ManageEnrollmentModal(props: ManageEnrollmentModalProps) {
  const { onClose } = props;
  const ctrl = useManageEnrollmentModal(props);

  return (
    <AppModal
      open
      onClose={ctrl.saving ? () => undefined : onClose}
      title="Manage Enrollment"
      subtitle={`Program: ${ctrl.program?.name ?? ''}`}
      maxWidth="max-w-5xl"
    >
      <Toaster toasts={ctrl.toasts} removeToast={ctrl.removeToast} />

      {ctrl.step === 'select' && <ManageEnrollmentSelectStep ctrl={ctrl} />}

      {ctrl.step === 'discount' && ctrl.changedCourse && (
        <div>
          {ctrl.submitError && (
            <p className="text-sm text-rose-600 font-semibold mb-3">{ctrl.submitError}</p>
          )}
          <DiscountAdjustmentPanel
            courses={ctrl.projectedCourses}
            currentDiscount={ctrl.enrollment.monthlyDiscount}
            triggerType={ctrl.triggerType}
            changedCourse={ctrl.changedCourse}
            effectiveMonth={ctrl.effMonth}
            onApply={ctrl.handleApply}
            onBack={() => ctrl.setStep('select')}
            isApplying={ctrl.saving}
            applyLabel={ctrl.progressText}
          />
        </div>
      )}

      {ctrl.step === 'success' && <ManageEnrollmentSuccessStep ctrl={ctrl} />}
    </AppModal>
  );
}

export type { ManageEnrollmentModalProps } from './manage-enrollment-modal-utils';
