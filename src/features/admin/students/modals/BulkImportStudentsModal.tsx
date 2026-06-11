'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { startBulkImportStudents } from '@/lib/api/students';
import type { BranchOption } from '../types';
import { StudentAdminField } from '../components/StudentAdminField';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminSelect } from '../components/StudentAdminSelect';

const ACCEPTED_COLUMNS = [
  'fullName / name / studentName',
  'mobile / phone / contactNumber',
  'email',
  'fatherName',
  'motherName',
  'fatherMobile',
  'motherMobile',
  'gender',
  'bloodGroup',
  'address',
  'smsAlertTo',
  'registrationNumber',
];

export function BulkImportStudentsModal({
  branches,
  defaultBranchId,
  onClose,
  onQueued,
}: {
  branches: BranchOption[];
  defaultBranchId?: string;
  onClose: () => void;
  onQueued: (payload: { jobId: string; totalRows: number; fileName: string }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId ?? '');
  const [defaultPassword, setDefaultPassword] = useState('123456');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileHint = useMemo(() => {
    if (!file) return 'Excel or CSV only, maximum 5 MB.';
    return `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
  }, [file]);

  const handleImport = async () => {
    if (!file) {
      setError('Please choose an Excel or CSV file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const res = await startBulkImportStudents(file, branchId || undefined, defaultPassword || '123456');
      if (!(res.success && res.data)) {
        throw new Error(res.message || 'Could not start import');
      }
      onQueued({
        jobId: res.data.jobId,
        totalRows: res.data.totalRows,
        fileName: file.name,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <StudentAdminModal
      open
      onClose={uploading ? () => undefined : onClose}
      title="Bulk Import Students"
      subtitle="File is processed in the background — progress appears at the bottom right"
      maxWidth="max-w-4xl"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-slate-900">Upload .xlsx, .xls, or .csv</p>
                <p className="text-xs text-slate-500 mt-1">
                  Keep one student per row. Mobile must use BD format 01XXXXXXXXX, 10 digits without the leading 0, or +880. Excel
                  &quot;number&quot; cells are OK. You can close this window after the file is accepted — import continues in the
                  background.
                </p>
              </div>
            </div>
          </div>

          <StudentAdminField label="Import File" required hint={fileHint}>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={uploading}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError('');
              }}
              className="focus-visible:ring-indigo-400"
            />
          </StudentAdminField>

          <div className="grid gap-3 sm:grid-cols-2">
            <StudentAdminField label="Default Branch" hint="Optional; choose the student registration branch.">
              <StudentAdminSelect
                value={branchId || '_none'}
                onChange={(value) => setBranchId(value === '_none' ? '' : value)}
                options={[
                  { value: '_none', label: 'No branch' },
                  ...branches.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
            </StudentAdminField>

            <StudentAdminField label="Default Password" required hint="Used for all imported students.">
              <Input
                value={defaultPassword}
                disabled={uploading}
                onChange={(e) => setDefaultPassword(e.target.value)}
                className="focus-visible:ring-indigo-400"
              />
            </StudentAdminField>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>Cancel</Button>
            <Button onClick={() => void handleImport()} disabled={uploading || !file} className="gap-2 bg-slate-900 text-white hover:bg-indigo-600">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Start Import</>}
            </Button>
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Accepted columns</p>
          <ul className="space-y-1.5 text-[11px] text-slate-600">
            {ACCEPTED_COLUMNS.map((col) => (
              <li key={col} className="font-medium">{col}</li>
            ))}
          </ul>
        </aside>
      </div>
    </StudentAdminModal>
  );
}
