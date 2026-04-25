'use client';

import { useState, useEffect } from 'react';
import { createQuestionFolder, updateQuestionFolder } from '@/lib/api/question-bank';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { QuestionFolder, CreateQuestionFolderDto, UpdateQuestionFolderDto } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface FolderFormProps {
  folders: QuestionFolder[];
  folder?: QuestionFolder | null;
  initialParentId?: string;
  onSuccess: () => Promise<void>;
}

export function FolderForm({ folders, folder, initialParentId, onSuccess }: FolderFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    parentFolderId: initialParentId || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!folder;

  useEffect(() => {
    if (folder) {
      setForm({
        name: folder.name,
        parentFolderId: folder.parentFolderId || '',
      });
    }
  }, [folder]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Folder name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload: CreateQuestionFolderDto = {
        name: form.name.trim(),
        parentFolderId: form.parentFolderId || undefined,
      };

      if (isEdit && folder) {
        await updateQuestionFolder(folder.id, payload as UpdateQuestionFolderDto);
      } else {
        await createQuestionFolder(payload);
      }
      
      toast({
        title: 'Success',
        description: `Folder ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} folder`;
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
            <label className={sectionLabel}>Folder Identity</label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Physics Chapter 1"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-1">
            <div className="space-y-2">
              <label className={sectionLabel}>Parent Hierarchy</label>
              <Select
                value={form.parentFolderId || 'none'}
                onValueChange={(v) => setForm((prev) => ({ ...prev, parentFolderId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Parent (Optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="none" className="text-sm font-medium">Root Folder</SelectItem>
                  {folders.filter(f => f.id !== folder?.id).map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-sm font-medium">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            className="flex-2 h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Update Folder' : 'Create Folder'}
          </Button>
        </div>
      </div>
    </div>
  );
}
