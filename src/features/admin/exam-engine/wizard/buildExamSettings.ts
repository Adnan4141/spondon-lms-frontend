import type { ExamProductType, ExamWizardState } from '../types';

/** UI-only fields stored under settings.examWizard (wizard re-hydration + presets). */
export function buildExamWizardSettings(state: ExamWizardState, productType: ExamProductType) {
  return {
    productType,
    examType: state.examType,
    scope: 'COURSE' as const,
    deliveryMode: state.deliveryMode,
    shuffle: state.shuffle,
    setNaming: state.setNaming,
    resultInputModes: state.resultInputModes,
    showSolve: state.showSolve,
    solveVisibility: state.solveVisibility,
    smsNotification: state.smsNotification,
    defaultNegativeMarks: state.defaultNegativeMarks,
    omrSheetSize: state.omrConfig?.sheetSize ?? null,
  };
}

/** Runtime routing fields under settings.examWorkflow (backend + student resolveExamWorkflow). */
export function buildExamWorkflowSettings(state: ExamWizardState, productType: ExamProductType) {
  const isWritten = productType === 'WRITTEN' || productType === 'COMBINED';
  return {
    productType,
    examType: state.examType,
    scope: 'COURSE' as const,
    deliveryMode: state.deliveryMode,
    resultInputModes: state.resultInputModes,
    evaluationMode: state.deliveryMode === 'OFFLINE' ? ('AGGREGATE' as const) : ('SCRIPT_UPLOAD' as const),
    officialResultPipeline: 'RESULT_BATCH' as const,
    submissionOwner: isWritten && state.deliveryMode === 'ONLINE' ? ('STUDENT' as const) : ('ADMIN' as const),
    writtenSubmission: isWritten && state.deliveryMode === 'ONLINE' ? ('CAMERA_OR_PDF' as const) : undefined,
    enableQrAnswerSheet: isWritten,
    enablePdfCombine: isWritten,
    sms: { enabled: state.smsNotification },
  };
}

/** Single source of truth for exam.settings JSON written by the wizard. */
export function buildExamSettingsFromWizardState(state: ExamWizardState) {
  const productType = state.productType as ExamProductType;
  return {
    proctorStrict: state.proctorStrict,
    examWizard: buildExamWizardSettings(state, productType),
    examWorkflow: buildExamWorkflowSettings(state, productType),
  };
}
