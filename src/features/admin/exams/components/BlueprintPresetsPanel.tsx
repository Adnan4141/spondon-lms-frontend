'use client';

/**
 * BlueprintPresetsPanel — Save / Load / Apply Exam Blueprint Rule Sets
 *
 * A "Blueprint" is a saved exam configuration (sections × folder rules × settings)
 * that can be reused across exams. Admins can:
 *   1. Save the current exam's blueprint config as a "Preset"
 *   2. Load a saved preset back into the current exam
 *   3. Edit/Delete/Duplicate presets
 *   4. Mark one preset as "Default" for a course
 *
 * Useful for recurring exams (monthly tests, weekly sets) that share the same structure.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  listBlueprintPresets,
  createBlueprintPreset,
  updateBlueprintPreset,
  deleteBlueprintPreset,
  duplicateBlueprintPreset,
  applyBlueprintToExam,
  getExamBlueprint,
  type ExamBlueprintPreset,
  type ExamBlueprint,
  type BlueprintSettings,
} from '@/lib/api/exams';
import {
  Trash2, Edit2, Star, StarOff, Copy,
  Save, X, RefreshCw, BookMarked, ChevronDown,
  ChevronUp, CheckCircle2, Layers, Clock, Download,
  Upload, Info,
} from 'lucide-react';

// ─── Preset Form ──────────────────────────────────────────────────────────────

function PresetForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: { name: string; description: string };
  onSave: (data: { name: string; description: string; isDefault: boolean }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [desc, setDesc] = useState(initial.description);
  const [isDefault, setIsDefault] = useState(false);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), description: desc.trim(), isDefault }); }}
      className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5"
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Preset Name *</label>
        <input
          type="text"
          required
          placeholder="e.g., Standard Admission Test 30MCQ+5CQ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (optional)</label>
        <textarea
          rows={2}
          placeholder="Brief description of this configuration…"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsDefault(!isDefault)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            isDefault ? 'bg-amber-500' : 'bg-slate-200',
          )}
        >
          <span className={cn('pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', isDefault ? 'translate-x-4' : 'translate-x-0')} />
        </button>
        <span className="text-sm font-medium text-slate-700">Set as default for this course</span>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="h-9 rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Saving…' : 'Save Preset'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-9 rounded-xl border-slate-200">
          <X className="h-3.5 w-3.5 mr-1" />Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Preset Card ──────────────────────────────────────────────────────────────

function PresetCard({
  preset,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleDefault,
  onLoadIntoExam,
  deleting,
  applying,
}: {
  preset: ExamBlueprintPreset;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleDefault: () => void;
  onLoadIntoExam: () => void;
  deleting: boolean;
  applying?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const structure = preset.structure as ExamBlueprint;
  const sections = structure?.sections ?? [];
  const settings = (structure?.settings ?? {}) as BlueprintSettings;

  return (
    <div className={cn(
      'rounded-2xl border bg-white transition-all',
      preset.isDefault ? 'border-amber-300 shadow-sm shadow-amber-100' : 'border-slate-200 hover:border-slate-300',
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
            preset.isDefault ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200',
          )}>
            <BookMarked className={cn('h-5 w-5', preset.isDefault ? 'text-amber-600' : 'text-slate-500')} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 truncate">{preset.name}</h4>
              {preset.isDefault && (
                <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200 border font-semibold">
                  ★ Default
                </Badge>
              )}
              {preset.course?.name && (
                <span className="text-[11px] text-slate-400 truncate">{preset.course.name}</span>
              )}
            </div>
            {preset.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{preset.description}</p>
            )}

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              {sections.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {sections.length} section{sections.length !== 1 ? 's' : ''}
                </span>
              )}
              {settings.totalSets && (
                <span className="inline-flex items-center gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  {settings.totalSets} sets
                </span>
              )}
              {settings.durationMinutes && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {settings.durationMinutes} min
                </span>
              )}
              {preset.totalMarks && (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {preset.totalMarks} marks
                </span>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded sections preview */}
        {expanded && sections.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-100 overflow-hidden">
            {sections.map((sec, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-slate-100 last:border-0 px-3 py-2.5 bg-slate-50/50"
              >
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                  sec.type === 'MCQ'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : sec.type === 'CQ'
                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                )}>
                  {sec.type}
                </span>
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">{sec.name}</span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {sec.questionCount}q · {(sec.questionCount * sec.marksPerQuestion).toFixed(0)}m
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          <Button
            size="sm"
            onClick={onLoadIntoExam}
            disabled={applying}
            className="h-7 rounded-xl text-xs gap-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {applying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {applying ? 'Applying…' : 'Apply to Exam'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicate}
            className="h-7 rounded-xl text-xs gap-1 border-slate-200"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleDefault}
            className={cn('h-7 rounded-xl text-xs gap-1', preset.isDefault ? 'border-amber-300 text-amber-700' : 'border-slate-200')}
          >
            {preset.isDefault ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
            {preset.isDefault ? 'Unset default' : 'Set default'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-7 rounded-xl text-xs gap-1 text-slate-500 hover:text-slate-700"
          >
            <Edit2 className="h-3 w-3" />
            Rename
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="h-7 rounded-xl text-xs gap-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          >
            {deleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface BlueprintPresetsPanelProps {
  examId: string;
  courseId?: string;
  onSectionsApplied?: () => void;
}

export function BlueprintPresetsPanel({ examId, courseId, onSectionsApplied }: BlueprintPresetsPanelProps) {
  const { toast } = useToast();
  const [presets, setPresets] = useState<ExamBlueprintPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingBlueprint, setSavingBlueprint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBlueprintPresets(courseId);
      if (res.success && res.data) setPresets(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load presets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => { load(); }, [load]);

  // Save current exam blueprint as a new preset
  const handleSaveCurrentBlueprint = async (meta: { name: string; description: string; isDefault: boolean }) => {
    setSavingBlueprint(true);
    try {
      // First fetch the current blueprint from the exam
      const bpRes = await getExamBlueprint(examId);
      const structure = bpRes.data;

      if (!structure || !structure.sections?.length) {
        toast({
          title: 'No blueprint configured',
          description: 'Go to the "Folder Rules" or "Subjects" tab to configure the exam blueprint first.',
          variant: 'destructive',
        });
        return;
      }

      const res = await createBlueprintPreset({
        name: meta.name,
        description: meta.description,
        courseId: courseId || undefined,
        structure,
        totalMarks: structure.sections?.reduce((s: number, sec: { questionCount: number; marksPerQuestion: number }) =>
          s + (sec.questionCount || 0) * (sec.marksPerQuestion || 0), 0) || undefined,
        duration: structure.settings?.durationMinutes,
        isDefault: meta.isDefault,
      });

      if (res.success) {
        toast({ title: 'Blueprint saved as preset!', variant: 'success' });
        setShowSaveForm(false);
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save preset', variant: 'destructive' });
    } finally {
      setSavingBlueprint(false);
    }
  };

  const handleRename = async (id: string, meta: { name: string; description: string }) => {
    setSaving(true);
    try {
      const res = await updateBlueprintPreset(id, { name: meta.name, description: meta.description });
      if (res.success) {
        toast({ title: 'Preset updated', variant: 'success' });
        setEditingId(null);
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this blueprint preset?')) return;
    setDeletingId(id);
    try {
      const res = await deleteBlueprintPreset(id);
      if (res.success) {
        toast({ title: 'Preset deleted', variant: 'success' });
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      const res = await duplicateBlueprintPreset(id, `${name} (Copy)`);
      if (res.success) {
        toast({ title: 'Preset duplicated', variant: 'success' });
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Duplication failed', variant: 'destructive' });
    }
  };

  const handleToggleDefault = async (preset: ExamBlueprintPreset) => {
    const res = await updateBlueprintPreset(preset.id, { isDefault: !preset.isDefault });
    if (res.success) {
      toast({ title: preset.isDefault ? 'Unset as default' : 'Set as default', variant: 'success' });
      await load();
    }
  };

  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleLoadIntoExam = async (preset: ExamBlueprintPreset) => {
    if (!window.confirm(
      `Apply "${preset.name}" to this exam?\n\nThis will REPLACE all existing sections with the ${(preset.structure as ExamBlueprint)?.sections?.length ?? 0} section(s) defined in this blueprint.`,
    )) return;

    setApplyingId(preset.id);
    try {
      const res = await applyBlueprintToExam(preset.id, examId);
      if (res.success) {
        toast({
          title: `Blueprint applied`,
          description: res.message ?? `${(res.data as any[])?.length ?? 0} section(s) created from "${preset.name}".`,
          variant: 'success',
        });
        onSectionsApplied?.();
      } else {
        toast({ title: 'Failed to apply blueprint', description: res.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to apply blueprint', variant: 'destructive' });
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Blueprint Presets</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Save exam configurations as reusable templates for one-click generation.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowSaveForm(true); setEditingId(null); }}
          className="h-8 rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          Save Current Blueprint
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          First configure the exam in the <strong>Folder Rules</strong> or <strong>Subjects</strong> tab,
          then save it here as a preset. You can later apply any preset to a new exam with one click.
        </p>
      </div>

      {/* Save form */}
      {showSaveForm && (
        <PresetForm
          initial={{ name: '', description: '' }}
          onSave={handleSaveCurrentBlueprint}
          onCancel={() => setShowSaveForm(false)}
          saving={savingBlueprint}
        />
      )}

      {/* Preset list */}
      {presets.length === 0 && !showSaveForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
            <BookMarked className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No presets saved</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            Configure an exam blueprint first, then save it here for reuse across future exams.
          </p>
          <Button
            size="sm"
            onClick={() => setShowSaveForm(true)}
            className="mt-4 h-8 rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Save Current Blueprint
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <div key={preset.id}>
              {editingId === preset.id ? (
                <PresetForm
                  initial={{ name: preset.name, description: preset.description ?? '' }}
                  onSave={(meta) => handleRename(preset.id, { name: meta.name, description: meta.description })}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <PresetCard
                  preset={preset}
                  onEdit={() => { setEditingId(preset.id); setShowSaveForm(false); }}
                  onDelete={() => handleDelete(preset.id)}
                  onDuplicate={() => handleDuplicate(preset.id, preset.name)}
                  onToggleDefault={() => handleToggleDefault(preset)}
                  onLoadIntoExam={() => handleLoadIntoExam(preset)}
                  deleting={deletingId === preset.id}
                  applying={applyingId === preset.id}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
