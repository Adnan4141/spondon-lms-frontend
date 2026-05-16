'use client';

import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { ExamBlueprintPreset } from '@/lib/api/exams';
import type { ExamWizardState, UiExamCategory } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { BasicExamInfoForm } from '../components/BasicExamInfoForm';
import { DeliveryModeCard } from '../components/DeliveryModeCard';
import { ExamMethodPicker } from '../components/ExamMethodPicker';
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
  onSelectCategory: (id: UiExamCategory) => void;
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
  onSelectCategory,
  clearFieldError,
  onStartBlank,
  onApplyPreset,
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

      <ExamMethodPicker
        value={state.uiCategory}
        invalid={Boolean(fieldErrors?.uiCategory)}
        onChange={(category) => {
          clearFieldError('uiCategory');
          onSelectCategory(category);
        }}
      />

      <DeliveryModeCard
        state={state}
        onChange={(deliveryMode) => dispatch({ type: 'MERGE', patch: { deliveryMode } })}
      />

      <WorkflowSummaryCard state={state} />

      <BasicExamInfoForm
        state={state}
        dispatch={dispatch}
        courses={courses}
        branches={branches}
        fieldErrors={fieldErrors}
        clearFieldError={clearFieldError}
      />
    </div>
  );
}
