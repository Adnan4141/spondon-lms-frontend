// ─── Components ───────────────────────────────────────────────────────────────
export { StudentsTable } from './components/StudentsTable';
export { StudentsToolbar } from './components/StudentsToolbar';
export { StudentsStats, type StudentsDatabaseStats } from './components/StudentsStats';
export { StudentFormFields } from './components/StudentFormFields';
export { StudentAdminBadge } from './components/StudentAdminBadge';
export { StudentAdminField } from './components/StudentAdminField';
export { StudentAdminModal } from './components/StudentAdminModal';
export { StudentAdminSelect } from './components/StudentAdminSelect';
export { StudentMonthInput } from './components/StudentMonthInput';
export { RowActions } from './components/RowActions';
export { SuccessSummary } from './components/SuccessSummary';

// ─── Enrollment ───────────────────────────────────────────────────────────────
export { CollectPaymentModal } from './enrollment/CollectPaymentModal';
export { DiscountAdjustmentPanel } from './enrollment/DiscountAdjustmentPanel';
export { EnrolledCoursesView } from './enrollment/EnrolledCoursesView';
export { EnrollmentModal } from './enrollment/EnrollmentModal';
export { ManageEnrollmentModal } from './enrollment/ManageEnrollmentModal';

// ─── Modals ───────────────────────────────────────────────────────────────────
export { AddStudentModal, type AddStudentSaveMeta } from './modals/AddStudentModal';
export {
	BulkImportProgressDock,
	BULK_STUDENT_IMPORT_COMPLETE_EVENT,
	BULK_QUESTION_IMPORT_COMPLETE_EVENT,
} from './components/BulkImportProgressDock';
export { BulkImportStudentsModal } from './modals/BulkImportStudentsModal';
export { EditStudentModal } from './modals/EditStudentModal';
export { StudentsPageContent } from './StudentsPageContent';
export { StudentDetailPageContent } from './StudentDetailPageContent';

// ─── Types & Utils ────────────────────────────────────────────────────────────
export type * from './types';
export * from './utils';
