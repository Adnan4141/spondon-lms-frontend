'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bulkImportStudents } from '@/lib/api/students';
import type { BranchOption } from '../types';
import { StudentAdminField } from '../components/StudentAdminField';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminSelect } from '../components/StudentAdminSelect';

type ImportResult = {
  created: number;
  errors: { row: number; message: string }[];
};

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
  onImported,
}: {
  branches: BranchOption[];
  defaultBranchId?: string;
  onClose: () => void;
  onImported: (result: ImportResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId ?? '');
  const [defaultPassword, setDefaultPassword] = useState('123456');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

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
    setResult(null);
    try {
      const res = await bulkImportStudents(file, branchId || undefined, defaultPassword || '123456');
      if (!(res.success && res.data)) {
        throw new Error(res.message || 'Bulk import failed');
      }
      setResult(res.data);
      onImported(res.data);
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
      subtitle="Create student accounts from Excel or CSV"
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
                  Keep one student per row. Mobile must use BD format 01XXXXXXXXX, 10 digits without the leading 0, or +880. Excel &quot;number&quot; cells are OK. For SMS recipients, write smsAlertTo as SELF,FATHER,MOTHER.
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
                setResult(null);
              }}
              className="focus-visible:ring-indigo-400"
            />
          </StudentAdminField>

          <div className="grid gap-3 sm:grid-cols-2">
            <StudentAdminField label="Default Branch" hint="Optional; leave empty if branch should be blank.">
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
            <div className="mt-2 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-rose-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-2 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <Check className="h-4 w-4" />
                <p className="text-sm font-black">Imported {result.created} student(s)</p>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 max-h-44 overflow-auto rounded-lg border border-amber-200 bg-white">
                  {result.errors.slice(0, 30).map((item) => (
                    <div key={`${item.row}-${item.message}`} className="flex gap-3 border-b border-slate-100 px-3 py-2 last:border-0">
                      <span className="text-xs font-black text-amber-600">Row {item.row}</span>
                      <span className="text-xs font-semibold text-slate-600">{item.message}</span>
                    </div>
                  ))}
                  {result.errors.length > 30 && (
                    <p className="px-3 py-2 text-xs font-semibold text-slate-400">
                      {result.errors.length - 30} more error(s) hidden.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">Accepted Columns</p>
          <div className="space-y-2">
            {ACCEPTED_COLUMNS.map((col) => (
              <div key={col} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {col}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-semibold text-amber-800">
              Avoid duplicate mobile numbers. Optional registrationNumber must be exactly 7 digits.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={uploading}>Close</Button>
        <Button
          onClick={handleImport}
          disabled={uploading}
          className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
        >
          <Upload className="h-4 w-4" /> {uploading ? 'Importing...' : 'Import Students'}
        </Button>
      </div>
    </StudentAdminModal>
  );
}
