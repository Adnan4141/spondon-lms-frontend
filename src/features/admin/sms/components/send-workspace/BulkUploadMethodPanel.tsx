'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { previewBulkUpload, type BulkPreview, type SmsRecipient } from '@/lib/api/sms';
import { EmptyState, Metric, Panel } from '../../sms-shared';

export function BulkUploadMethodPanel({
  onResolved,
  onVariablesChange,
}: {
  onResolved: (recipients: SmsRecipient[]) => void;
  onVariablesChange: (variables: string[]) => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [mobileColumn, setMobileColumn] = useState('');
  const [nameColumn, setNameColumn] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [loading, setLoading] = useState(false);

  function applyMappedRecipients(nextPreview = preview, variables = selectedVariables, nextNameColumn = nameColumn) {
    if (!nextPreview?.validRecipients?.length) {
      onResolved([]);
      onVariablesChange([]);
      return;
    }
    onVariablesChange(nextNameColumn ? [...new Set(['name', ...variables])] : variables);
    onResolved(nextPreview.validRecipients.map((recipient) => {
      const rowVars = recipient.variables || {};
      const pickedVars = variables.reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = rowVars[key];
        return acc;
      }, {});
      const displayName = nextNameColumn ? String(rowVars[nextNameColumn] || '') : recipient.name || '';
      return {
        ...recipient,
        name: displayName || recipient.name,
        variables: {
          ...pickedVars,
          ...(displayName ? { name: displayName } : {}),
          phone: recipient.phone,
        },
      };
    }));
  }

  async function previewFile(column?: string) {
    if (!file) {
      toast({ title: 'Select a CSV or Excel file first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await previewBulkUpload(file, column || mobileColumn || undefined);
      if (!res.success) throw new Error(res.message || 'Could not preview file');
      setPreview(res.data);
      setMobileColumn(res.data.mobileColumn || column || mobileColumn);
      setNameColumn('');
      setSelectedVariables([]);
      onVariablesChange([]);
      onResolved((res.data.validRecipients || res.data.valid.map((phone) => ({ phone, variables: { phone } }))).map((recipient) => ({
        phone: recipient.phone,
        variables: { phone: recipient.phone },
      })));
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Could not preview file', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function downloadErrors() {
    if (!preview) return;
    const rows = ['type,value', ...preview.invalid.map((item) => `invalid,${JSON.stringify(item)}`), ...preview.duplicates.map((item) => `duplicate,${JSON.stringify(item)}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sms-upload-errors.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Panel title="Bulk Upload">
      <div className="space-y-4">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:bg-slate-100">
          <Upload className="h-9 w-9 text-blue-600" />
          <span className="mt-3 text-sm font-semibold text-slate-900">{file ? file.name : 'Drag file or click to browse'}</span>
          <span className="mt-1 text-xs text-slate-500">Supports .csv .xlsx .xls</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              setFile(next);
              setPreview(null);
              setMobileColumn('');
              setNameColumn('');
              setSelectedVariables([]);
              onVariablesChange([]);
              onResolved([]);
            }}
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          {preview?.columns?.length ? (
            <div className="min-w-56">
              <Label>Mobile Column</Label>
              <Select value={mobileColumn || preview.mobileColumn || preview.columns[0]} onValueChange={(column) => { setMobileColumn(column); void previewFile(column); }}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {preview.columns.map((column) => <SelectItem key={column} value={column}>{column}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <Button type="button" onClick={() => void previewFile()} disabled={loading || !file} className="gap-2">
            {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Preview & Validate
          </Button>
          <Button type="button" variant="outline" disabled={!preview || (!preview.invalid.length && !preview.duplicates.length)} onClick={downloadErrors}>
            Download error report
          </Button>
        </div>
        {preview ? (
          <div className="space-y-3">
            {preview.columns?.length ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Name Column (optional)</Label>
                    <Select
                      value={nameColumn || 'none'}
                      onValueChange={(value) => {
                        const next = value === 'none' ? '' : value;
                        setNameColumn(next);
                        applyMappedRecipients(preview, selectedVariables, next);
                      }}
                    >
                      <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No name column</SelectItem>
                        {preview.columns.map((column) => <SelectItem key={column} value={column}>{column}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Message Variables</p>
                    <p className="mt-1 text-xs text-slate-500">Select Excel columns to expose as composer chips.</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {preview.columns.filter((column) => column !== (mobileColumn || preview.mobileColumn)).map((column) => (
                    <label key={column} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                      <Checkbox
                        checked={selectedVariables.includes(column)}
                        onCheckedChange={() => {
                          const next = selectedVariables.includes(column)
                            ? selectedVariables.filter((item) => item !== column)
                            : [...selectedVariables, column];
                          setSelectedVariables(next);
                          applyMappedRecipients(preview, next, nameColumn);
                        }}
                      />
                      <span className="truncate font-semibold text-slate-700">{`{${column}}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Valid" value={preview.validCount} tone="emerald" />
              <Metric label="Invalid" value={preview.invalidCount} tone="amber" />
              <Metric label="Duplicate" value={preview.duplicateCount} tone="slate" />
            </div>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {(preview.columns || []).slice(0, 6).map((column) => <th key={column} className="px-3 py-2 text-left">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(preview.sampleRows || []).slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      {(preview.columns || []).slice(0, 6).map((column) => <td key={column} className="px-3 py-2 text-slate-700">{String(row[column] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState>Upload a file and preview it to validate mobile numbers before queueing.</EmptyState>
        )}
      </div>
    </Panel>
  );
}
