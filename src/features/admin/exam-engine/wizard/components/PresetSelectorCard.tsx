'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ExamBlueprintPreset } from '@/lib/api/exams';

type Props = {
  presets: ExamBlueprintPreset[];
  appliedPresetId: string | null;
  recommendedPresetId: string | null;
  busy: boolean;
  onStartBlank: () => void;
  onApplyPreset: (presetId: string) => void;
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

function presetSummary(preset: ExamBlueprintPreset) {
  const wizard = preset.structure.wizard as Record<string, unknown> | undefined;
  const sections = Array.isArray(wizard?.sections) ? wizard.sections.length : preset.structure.sections.length;
  const subjects = Array.isArray(wizard?.subjects) ? wizard.subjects.length : 0;
  const method = typeof wizard?.uiCategory === 'string' ? wizard.uiCategory : 'MCQ';
  const duration = typeof wizard?.durationMinutes === 'string'
    ? wizard.durationMinutes
    : String(preset.structure.settings.durationMinutes ?? preset.duration ?? '');
  const setCount = typeof wizard?.nSets === 'string'
    ? wizard.nSets
    : String(preset.structure.settings.totalSets ?? '');

  return [
    method,
    duration ? `${duration} min` : null,
    subjects ? `${subjects} subject${subjects === 1 ? '' : 's'}` : `${sections} section${sections === 1 ? '' : 's'}`,
    setCount ? `${setCount} set${setCount === '1' ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function PresetSelectorCard({
  presets,
  appliedPresetId,
  recommendedPresetId,
  busy,
  onStartBlank,
  onApplyPreset,
}: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-base text-[#0D1B35]">Start from preset</CardTitle>
        <CardDescription>Reuse a saved setup or begin with a blank exam.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={onStartBlank}
          className={cn(
            'rounded-lg border p-4 text-left transition hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
            !appliedPresetId ? 'border-[#0D1B35] bg-[#0D1B35]/[0.04]' : 'border-slate-200 bg-white',
          )}
        >
          <div className="font-semibold text-slate-900">Blank exam</div>
          <p className="mt-1 text-xs text-slate-500">Start from scratch and configure manually.</p>
        </button>

        {presets.map((preset) => {
          const active = appliedPresetId === preset.id;
          const recommended = recommendedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => onApplyPreset(preset.id)}
              className={cn(
                'rounded-lg border p-4 text-left transition hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60 disabled:cursor-wait',
                active ? 'border-[#0D1B35] bg-[#0D1B35]/[0.04]' : 'border-slate-200 bg-white',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">{preset.name}</span>
                {preset.isDefault ? <Badge className="bg-emerald-100 text-emerald-800">Default</Badge> : null}
                {preset.courseId ? <Badge variant="secondary">Course scoped</Badge> : null}
                {recommended && !preset.isDefault ? <Badge variant="outline">Recommended</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {preset.course?.name ?? 'Global preset'}
                {preset.updatedAt ? ` · Updated ${formatUpdatedAt(preset.updatedAt)}` : ''}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-700">{presetSummary(preset)}</p>
            </button>
          );
        })}

        {!presets.length ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No saved presets yet.
          </div>
        ) : null}
      </CardContent>
      {appliedPresetId ? (
        <div className="border-t border-slate-100 px-6 py-3 text-xs font-medium text-emerald-700">
          Preset applied. Review before saving.
        </div>
      ) : null}
      {busy ? (
        <div className="border-t border-slate-100 px-6 py-3">
          <Button type="button" variant="ghost" size="sm" disabled>
            Applying preset...
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
