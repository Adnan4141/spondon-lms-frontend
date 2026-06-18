import type { BranchOption, Course, Program, Student } from '../types';

export interface EnrollmentModalProps {
  student: Student;
  programs: Program[];
  allCourses: Course[];
  branches: BranchOption[];
  onClose: () => void;
  onSave: (data: {
    student: Student;
    program: Program | undefined;
    netMonthly: number;
    admFee: number;
  }) => void;
}
