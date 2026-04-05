'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';

export type GridSettingsState = {
  startHour: number;
  endHour: number;
};

const DEFAULT_SETTINGS: GridSettingsState = { startHour: 6, endHour: 22 };

function storageKey(branchId?: string) {
  return `routine_grid_settings${branchId ? `_${branchId}` : ''}`;
}

export function loadGridSettings(branchId?: string): GridSettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(storageKey(branchId));
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

type Props = {
  branchId?: string;
  settings: GridSettingsState;
  onSettingsChange: (s: GridSettingsState) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function GridSettings({ branchId, settings, onSettingsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(settings);

  useEffect(() => { setLocal(settings); }, [settings]);

  const save = () => {
    try {
      localStorage.setItem(storageKey(branchId), JSON.stringify(local));
    } catch { /* ignore */ }
    onSettingsChange(local);
    setOpen(false);
  };

  const fmtHour = (h: number) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${ampm}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Grid ({settings.startHour}:00–{settings.endHour}:00)
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Grid Time Range</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-bold text-slate-600">Start Hour</Label>
            <Select
              value={String(local.startHour)}
              onValueChange={(v) => setLocal((s) => ({ ...s, startHour: Number(v) }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.slice(0, 20).map((h) => (
                  <SelectItem key={h} value={String(h)} disabled={h >= local.endHour - 1}>
                    {fmtHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-600">End Hour</Label>
            <Select
              value={String(local.endHour)}
              onValueChange={(v) => setLocal((s) => ({ ...s, endHour: Number(v) }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.slice(1).map((h) => (
                  <SelectItem key={h} value={String(h)} disabled={h <= local.startHour}>
                    {fmtHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="flex-1" onClick={save} disabled={local.endHour <= local.startHour + 1}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
