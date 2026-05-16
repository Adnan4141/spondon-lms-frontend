'use client';

import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ExamBlueprintPreset } from '@/lib/api/exams';

type Props = {
  presets: ExamBlueprintPreset[];
  appliedPresetId: string | null;
  busy: boolean;
  onSaveNew: (name: string, isDefault: boolean) => void | Promise<void>;
  onUpdate: (presetId: string, isDefault: boolean) => void | Promise<void>;
};

export function PresetSaveActions({ presets, appliedPresetId, busy, onSaveNew, onUpdate }: Props) {
  const appliedPreset = useMemo(
    () => presets.find((preset) => preset.id === appliedPresetId) ?? null,
    [appliedPresetId, presets],
  );
  const [name, setName] = useState(appliedPreset?.name ?? '');
  const [isDefault, setIsDefault] = useState(appliedPreset?.isDefault ?? false);

  const trimmedName = name.trim();

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Reusable preset</CardTitle>
        <CardDescription>Save this configuration for future exams without copying titles, schedules, questions, or results.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label>Preset name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. SSC Math model test"
              className="border-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <Label className="text-sm">Set as course default</Label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={!trimmedName || busy}
            onClick={() => void onSaveNew(trimmedName, isDefault)}
          >
            <Save className="h-4 w-4" />
            Save as preset
          </Button>
          {appliedPreset ? (
            <Button
              type="button"
              className="gap-2 bg-[#0D1B35] text-[#E2C98A]"
              disabled={busy}
              onClick={() => void onUpdate(appliedPreset.id, isDefault)}
            >
              Update preset
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
