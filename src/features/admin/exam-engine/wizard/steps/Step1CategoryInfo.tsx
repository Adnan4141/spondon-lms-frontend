'use client';

import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { ExamBlueprintPreset } from '@/lib/api/exams';
import type { ExamProductType, ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { AudienceCard } from '../components/AudienceCard';
import { BasicExamInfoForm } from '../components/BasicExamInfoForm';
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
  wizardVariant?: 'admin' | 'teacher';
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
  wizardVariant = 'admin',
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

      <div className="grid gap-4 xl:grid-cols-2">
        <BasicExamInfoForm
          state={state}
          dispatch={dispatch}
          deliveryMode={deliveryMode}
          courses={courses}
          allowedExamTypes={wizardVariant === 'teacher' ? ['MODEL', 'PRACTICE', 'SCHEDULED'] : undefined}
          fieldErrors={fieldErrors}
          clearFieldError={clearFieldError}
        />

        <AudienceCard
          state={state}
          dispatch={dispatch}
          courses={courses}
          branches={branches}
          fieldErrors={fieldErrors}
          clearFieldError={clearFieldError}
        />
      </div>

      <ExamMethodPicker
        value={state.productType}
        invalid={Boolean(fieldErrors?.productType)}
        onChange={(productType) => {
          clearFieldError('productType');
          onSelectProductType(productType);
        }}
      />

      <OmrSheetConfigCard state={state} dispatch={dispatch} deliveryMode={deliveryMode} />

      <WorkflowSummaryCard state={state} deliveryMode={deliveryMode} />
    </div>
  );
}
