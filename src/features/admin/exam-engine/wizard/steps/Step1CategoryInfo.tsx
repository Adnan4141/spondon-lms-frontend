'use client';

import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { ExamBlueprintPreset } from '@/lib/api/exams';
import type { ExamProductType, ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { BasicExamInfoForm } from '../components/BasicExamInfoForm';
import { DeliveryModeCard } from '../components/DeliveryModeCard';
import { ExamMethodPicker } from '../components/ExamMethodPicker';
import { OmrSheetConfigCard } from '../components/OmrSheetConfigCard';
import { PresetSelectorCard } from '../components/PresetSelectorCard';
import { WorkflowSummaryCard } from '../components/WorkflowSummaryCard';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  courses: Course[];
  branches: Branch[];
  presets: ExamBlueprintPreset[];
  appliedPresetId: string | null;
  recommendedPresetId: string | null;
  presetBusy: boolean;
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  onSelectProductType: (id: ExamProductType) => void;
  clearFieldError: (key: Step1FieldKey) => void;
  onStartBlank: () => void;
  onApplyPreset: (presetId: string) => void;
};

export function Step1CategoryInfo({
  state,
  dispatch,
  courses,
  branches,
  presets,
  appliedPresetId,
  recommendedPresetId,
  presetBusy,
  fieldErrors,
  onSelectProductType,
  clearFieldError,
  onStartBlank,
  onApplyPreset,
}: Props) {
  const toast = useAdminToast();

  const handleDeliveryModeChange = (deliveryMode: ExamWizardState['deliveryMode']) => {
    const hadAutomated = state.resultInputModes.includes('AUTOMATED');
    dispatch({ type: 'SET_DELIVERY_MODE', deliveryMode });
    if (
      deliveryMode === 'OFFLINE'
      && hadAutomated
      && (state.productType === 'MCQ' || state.productType === 'MULTI' || state.productType === 'COMBINED')
    ) {
      toast({
        title: 'Automatic grading removed',
        description: 'Use OMR scan in step 5 for offline MCQ papers. Question sets still come from the bank.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <PresetSelectorCard
        presets={presets}
        appliedPresetId={appliedPresetId}
        recommendedPresetId={recommendedPresetId}
        busy={presetBusy}
        onStartBlank={onStartBlank}
        onApplyPreset={onApplyPreset}
      />

      <BasicExamInfoForm
        state={state}
        dispatch={dispatch}
        courses={courses}
        branches={branches}
        fieldErrors={fieldErrors}
        clearFieldError={clearFieldError}
      />

      <ExamMethodPicker
        value={state.productType}
        invalid={Boolean(fieldErrors?.productType)}
        onChange={(productType) => {
          clearFieldError('productType');
          onSelectProductType(productType);
        }}
      />

      <DeliveryModeCard state={state} onChange={handleDeliveryModeChange} />

      <OmrSheetConfigCard state={state} dispatch={dispatch} />

      <WorkflowSummaryCard state={state} />
    </div>
  );
}
