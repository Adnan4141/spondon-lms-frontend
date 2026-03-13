'use client';

import { useState, useEffect } from 'react';
import { createProgram, updateProgram } from '@/lib/api/programs';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Program, CreateProgramDto, UpdateProgramDto } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const textareaClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface ProgramFormProps {
  program?: Program | null;
  onSuccess: () => Promise<void>;
}

export function ProgramForm({ program, onSuccess }: ProgramFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', description: '', thumbnail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!program;

  useEffect(() => {
    if (program) {
      setForm({
        name: program.name,
        description: program.description || '',
        thumbnail: program.thumbnail || '',
      });
    }
  }, [program]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Program name is required.');
      return;
    }

    const payload: CreateProgramDto | UpdateProgramDto = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      
      if (isEdit && program) {
        await updateProgram(program.id, payload as UpdateProgramDto);
      } else {
        await createProgram(payload as CreateProgramDto);
      }
      
      toast({
        title: 'Success',
        description: `Program ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEdit ? 'update' : 'create'} program`;
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="space-y-8">
          <div className="space-y-2">
            <label className={sectionLabel}>Program Identity</label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Higher Secondary Certificate (HSC)"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Thumbnail URL</label>
            <Input
              className={inputClass}
              value={form.thumbnail}
              onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
              placeholder="https://example.com/thumbnail.png"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Description & Scope</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={8}
              placeholder="Outline the program objectives and academic goals..."
              className={textareaClass}
            />
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={closeModal}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Update Changes' : 'Launch Program'}
          </Button>
        </div>
      </div>
    </div>
  );
}
