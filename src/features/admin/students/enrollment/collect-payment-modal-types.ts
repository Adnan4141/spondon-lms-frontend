import type { Student } from '../types';

export interface CollectPaymentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (data: { student: Student; month: string; method: string; amount: number }) => void;
}
