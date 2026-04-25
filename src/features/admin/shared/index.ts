// ─── Layout & Core ────────────────────────────────────────────────────────────
export { AdminLayout } from './AdminLayout';
export { ConfirmationModal } from './ConfirmationModal';
export { GlobalModal } from './GlobalModal';
export { Sidebar } from './Sidebar';

// ─── Shared Utilities ─────────────────────────────────────────────────────────
export { InstituteCombobox } from './InstituteCombobox';

// ─── Sub-modules (direct imports for tree-shaking) ────────────────────────────
// Use: import { AcademicRecordsExplorer } from '@/features/admin/shared/academic-records/AcademicRecordsExplorer'
// Use: import { RecordPaymentDialog } from '@/features/admin/shared/invoices/RecordPaymentDialog'
// Use: import { TrustFeaturesManager } from '@/features/admin/shared/site-content/TrustFeaturesManager'
// Use: import { AdminDatePicker } from '@/features/admin/shared/form/AdminField'
