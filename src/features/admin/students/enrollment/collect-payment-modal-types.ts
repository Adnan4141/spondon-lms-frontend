import type { InvoiceBillingType } from './collect-payment-modal-utils';
import type { Student } from '../types';

export interface CollectPaymentSaveData {
  student: Student;
  method: string;
  amount: number;
  billingType: InvoiceBillingType;
  month?: string;
  programName?: string;
  accessStatus?: string;
}

export interface CollectPaymentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (data: CollectPaymentSaveData) => void;
}
