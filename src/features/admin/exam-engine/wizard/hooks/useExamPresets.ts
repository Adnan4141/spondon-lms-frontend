import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createBlueprintPreset,
  getBlueprintPreset,
  listBlueprintPresets,
  updateBlueprintPreset,
  type ExamBlueprintPreset,
} from '@/lib/api/exams';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import {
  buildPresetStructure,
  presetPatchFromStructure,
  type WizardPresetStructure,
} from '../presetHelpers';
import { primaryCourseId } from '../wizardHelpers';

interface Options {
  examId?: string;
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  setActiveSectionId: (id: string | null) => void;
}

/**
 * Owns blueprint-preset listing, loading, applying, saving, and updating.
 * Auto-applies the recommended preset for the primary course when no
 * wizard state has been chosen yet.
 */
export function useExamPresets({ examId, state, dispatch, setActiveSectionId }: Options) {
  const toast = useAdminToast();
  const [presets, setPresets] = useState<ExamBlueprintPreset[]>([]);
  const [presetBusy, setPresetBusy] = useState(false);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    const response = await listBlueprintPresets();
    if (response.success && response.data) {
      setPresets(response.data);
      return;
    }
    setPresets([]);
  }, []);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const selectedPrimaryCourseId = primaryCourseId(state.courseIds);
  const recommendedPresetId = useMemo(() => {
    if (!selectedPrimaryCourseId) return null;
    return presets.find((preset) => preset.courseId === selectedPrimaryCourseId && preset.isDefault)?.id ?? null;
  }, [presets, selectedPrimaryCourseId]);

  const applyPreset = useCallback(
    async (presetId: string) => {
      setPresetBusy(true);
      try {
        const response = await getBlueprintPreset(presetId);
        if (!response.success || !response.data) {
          toast({
            title: 'Preset failed',
            description: response.message ?? 'Could not load preset.',
            variant: 'destructive',
          });
          return;
        }

        const patch = presetPatchFromStructure(response.data.structure as WizardPresetStructure);
        if (!patch) {
          toast({
            title: 'Preset failed',
            description: 'This preset does not contain reusable wizard settings.',
            variant: 'destructive',
          });
          return;
        }

        dispatch({ type: 'MERGE', patch });
        setAppliedPresetId(response.data.id);
        setActiveSectionId(patch.subjects?.[0]?.localId ?? patch.sections?.[0]?.localId ?? null);
        toast({ title: 'Preset applied', description: 'Review the configuration before saving.' });
      } finally {
        setPresetBusy(false);
      }
    },
    [dispatch, setActiveSectionId, toast],
  );

  useEffect(() => {
    if (examId || appliedPresetId || !recommendedPresetId) return;
    if (state.productType || state.sections.length || state.subjects.length) return;
    void applyPreset(recommendedPresetId);
  }, [
    appliedPresetId,
    applyPreset,
    examId,
    recommendedPresetId,
    state.sections.length,
    state.subjects.length,
    state.productType,
  ]);

  const startBlankExam = useCallback(() => {
    setAppliedPresetId(null);
    setActiveSectionId(null);
  }, [setActiveSectionId]);

  const savePreset = useCallback(
    async (name: string, isDefault: boolean) => {
      const courseId = primaryCourseId(state.courseIds);
      const response = await createBlueprintPreset({
        name,
        courseId: courseId || undefined,
        structure: buildPresetStructure(state),
        duration: Number(state.durationMinutes) || undefined,
        isDefault,
      });
      if (!response.success || !response.data) {
        toast({ title: 'Preset save failed', description: response.message, variant: 'destructive' });
        return null;
      }
      setAppliedPresetId(response.data.id);
      await loadPresets();
      toast({ title: 'Preset saved' });
      return response.data;
    },
    [loadPresets, state, toast],
  );

  const updatePreset = useCallback(
    async (presetId: string, isDefault: boolean) => {
      const courseId = primaryCourseId(state.courseIds);
      const response = await updateBlueprintPreset(presetId, {
        courseId: courseId || '',
        structure: buildPresetStructure(state),
        duration: Number(state.durationMinutes) || undefined,
        isDefault,
      });
      if (!response.success || !response.data) {
        toast({ title: 'Preset update failed', description: response.message, variant: 'destructive' });
        return null;
      }
      await loadPresets();
      toast({ title: 'Preset updated' });
      return response.data;
    },
    [loadPresets, state, toast],
  );

  return {
    presets,
    presetBusy,
    appliedPresetId,
    setAppliedPresetId,
    recommendedPresetId,
    applyPreset,
    startBlankExam,
    savePreset,
    updatePreset,
    loadPresets,
  };
}
