'use client';

import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import type { CollectPaymentModalProps } from './collect-payment-modal-types';
import { useCollectPaymentModal } from './hooks/useCollectPaymentModal';
import { CollectPaymentLeftPanel } from './CollectPaymentLeftPanel';
import { CollectPaymentRightPanel } from './CollectPaymentRightPanel';

export function CollectPaymentModal(props: CollectPaymentModalProps) {
  const { student, onClose } = props;
  const ctrl = useCollectPaymentModal(props);

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Collect Payment — ${student.fullName}`}
      subtitle={`Reg: ${student.regNo} · ${student.mobile}`}
      maxWidth="max-w-7xl"
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
        <CollectPaymentLeftPanel ctrl={ctrl} />
        <CollectPaymentRightPanel ctrl={ctrl} />
      </div>
    </AppModal>
  );
}

export type { CollectPaymentModalProps } from './collect-payment-modal-types';
