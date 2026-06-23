import type { Enrollment, Program } from '../types';

export type ManageOneTimeStep = 'select' | 'success';

export type ManageOneTimeResult = {
  added: number;
  removed: number;
  failed: number;
  supplementary: boolean;
  installmentScheduleStale?: boolean;
  invoiceId?: string | null;
  oneTimeDiscountUpdated?: boolean;
};

export type CourseMeta = { batch: string; includeBook?: boolean };

export interface ManageOneTimeEnrollmentModalProps {
  enrollment: Enrollment;
  programs: Program[];
  studentUserId: string;
  initialCancelCourseId?: string;
  onClose: () => void;
  onDone: (summary: ManageOneTimeResult) => void;
}
