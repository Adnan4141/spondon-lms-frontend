'use client';

import { useState, useRef } from 'react';
import { bulkImportStudents } from '@/lib/api/students';
import { useModalStore } from '@/store/modalStore';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkImportFormProps {
  branches: Branch[];
  onSuccess: () => Promise<void>;
  onClose: () => void;
  toast: (opts: { title: string; description?: string; variant?: 'success' | 'destructive' }) => void;
}

export function BulkImportForm({ branches, onSuccess, toast }: BulkImportFormProps) {
  const { closeModal } = useModalStore();
  const [file, setFile] = useState<File | null>(null);
  const [branchId, setBranchId] = useState('all');
  const [defaultPassword, setDefaultPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: 'Error', description: 'Select a CSV or Excel file', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await bulkImportStudents(file, branchId === 'all' ? undefined : branchId, defaultPassword);
      if (res.success && res.data) {
        const { created, errors } = res.data;
        toast({
          title: 'Bulk Import Done',
          description: `Imported ${created} students. ${errors?.length ? `${errors.length} row(s) had errors.` : ''}`,
          variant: errors?.length ? 'destructive' : 'success',
        });
        closeModal();
        await onSuccess();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Bulk import failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">File (CSV or Excel)</label>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:bg-slate-100 hover:border-indigo-300 transition-all"
        >
          {file ? (
            <>
              <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
              <span className="font-bold text-sm">{file.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="font-bold text-sm">Click to select file</span>
            </>
          )}
        </button>
      </div>
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Default Branch</label>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="h-12 rounded-2xl border-slate-200">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Default Password</label>
        <input
          type="text"
          value={defaultPassword}
          onChange={(e) => setDefaultPassword(e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-900"
          placeholder="123456"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1 flex h-12 rounded-2xl" onClick={closeModal}>
          Cancel
        </Button>
        <Button className="flex-1 h-12 rounded-2xl" onClick={handleSubmit} disabled={submitting || !file}>
          {submitting ? 'Importing...' : 'Import'}
        </Button>
      </div>
    </div>
  );
}
