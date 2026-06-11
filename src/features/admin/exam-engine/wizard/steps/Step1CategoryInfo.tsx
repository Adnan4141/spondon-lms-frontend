'use client';

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
  deliveryMode: 'ONLINE' | 'OFFLINE';
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  onSelectProductType: (id: ExamProductType) => void;
  clearFieldError: (key: Step1FieldKey) => void;
  onStartBlank: () => void;
  onApplyPreset: (presetId: string) => void;
  onCourseSelect: (course: Course) => void;
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
  deliveryMode,
  fieldErrors,
  onSelectProductType,
  clearFieldError,
  onStartBlank,
  onApplyPreset,
  onCourseSelect,
}: Props) {
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
        deliveryMode={deliveryMode}
        fieldErrors={fieldErrors}
        clearFieldError={clearFieldError}
        onCourseSelect={onCourseSelect}
      />

      <ExamMethodPicker
        value={state.productType}
        invalid={Boolean(fieldErrors?.productType)}
        onChange={(productType) => {
          clearFieldError('productType');
          onSelectProductType(productType);
        }}
      />

      <DeliveryModeCard
        courseId={state.courseId}
        courses={courses}
        deliveryMode={deliveryMode}
        productType={state.productType}
        dispatch={dispatch}
      />

      <OmrSheetConfigCard state={state} dispatch={dispatch} deliveryMode={deliveryMode} />

      <WorkflowSummaryCard state={state} deliveryMode={deliveryMode} />
    </div>
  );
}
