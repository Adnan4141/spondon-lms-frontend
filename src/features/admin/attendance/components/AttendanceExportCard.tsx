'use client';

import { Download, FileSpreadsheet, Loader2, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { monthPreset } from '../attendance-utils';
import type { AttendanceSheetController } from '../hooks/useAttendanceSheet';

type Props = Pick<
  AttendanceSheetController,
  | 'exporting'
  | 'runExport'
  | 'offlineSource'
  | 'setOfflineSource'
  | 'offlineStart'
  | 'setOfflineStart'
  | 'offlineEnd'
  | 'setOfflineEnd'
  | 'offlineInstitution'
  | 'setOfflineInstitution'
  | 'offlinePreview'
  | 'setOfflinePreview'
  | 'offlinePreviewing'
  | 'offlineDownloading'
  | 'runOfflinePreview'
  | 'runOfflineDownload'
  | 'importFile'
  | 'setImportFile'
  | 'importing'
  | 'importResult'
  | 'setImportResult'
  | 'fileRef'
  | 'runImport'
>;

export function AttendanceExportCard({
  exporting,
  runExport,
  offlineSource,
  setOfflineSource,
  offlineStart,
  setOfflineStart,
  offlineEnd,
  setOfflineEnd,
  offlineInstitution,
  setOfflineInstitution,
  offlinePreview,
  setOfflinePreview,
  offlinePreviewing,
  offlineDownloading,
  runOfflinePreview,
  runOfflineDownload,
  importFile,
  setImportFile,
  importing,
  importResult,
  setImportResult,
  fileRef,
  runImport,
}: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-base">Export / Offline Sheet / Import</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Export filled attendance</p>
          <p className="text-xs text-muted-foreground">
            Downloads all recorded attendance records (uses the date range set above if selected).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!!exporting}
              onClick={() => void runExport('xlsx')}
            >
              {exporting === 'xlsx' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
              Excel
            </Button>
            <Button size="sm" variant="outline" disabled={!!exporting} onClick={() => void runExport('csv')}>
              {exporting === 'csv' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
              CSV
            </Button>
          </div>
        </div>

        <div className="border-t" />

        <div className="space-y-3">
          <p className="text-sm font-medium">Generate offline (blank) sheet</p>
          <p className="text-xs text-muted-foreground">
            Blank sheet for teachers to mark manually and upload back. Compatible with the import format.
          </p>

          <div className="flex flex-wrap gap-2">
            {(['published', 'routine'] as const).map((src) => (
              <Button
                key={src}
                size="sm"
                variant={offlineSource === src ? 'default' : 'outline'}
                className={cn('h-8 text-xs capitalize', offlineSource === src && 'bg-emerald-600 hover:bg-emerald-700')}
                onClick={() => {
                  setOfflineSource(src);
                  setOfflinePreview(null);
                }}
              >
                {src === 'published' ? 'Published sessions' : 'Generate from routine'}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  const p = monthPreset(0);
                  setOfflineStart(p.start);
                  setOfflineEnd(p.end);
                  setOfflinePreview(null);
                }}
              >
                This month
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  const p = monthPreset(1);
                  setOfflineStart(p.start);
                  setOfflineEnd(p.end);
                  setOfflinePreview(null);
                }}
              >
                Next month
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">Start</span>
                <Input
                  type="date"
                  className="h-8 w-36 text-xs"
                  value={offlineStart}
                  onChange={(e) => {
                    setOfflineStart(e.target.value);
                    setOfflinePreview(null);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">End</span>
                <Input
                  type="date"
                  className="h-8 w-36 text-xs"
                  value={offlineEnd}
                  onChange={(e) => {
                    setOfflineEnd(e.target.value);
                    setOfflinePreview(null);
                  }}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={!offlineStart || !offlineEnd || offlinePreviewing}
                onClick={() => void runOfflinePreview()}
              >
                {offlinePreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex max-w-xs flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">Institution name (optional)</span>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Mathlab Academy"
              value={offlineInstitution}
              onChange={(e) => setOfflineInstitution(e.target.value)}
            />
          </div>

          {offlinePreview ? (
            <div
              className={cn(
                'rounded-lg border px-4 py-3 text-sm',
                offlinePreview.sessionCount === 0
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800',
              )}
            >
              {offlinePreview.sessionCount === 0 ? (
                <p>
                  {offlineSource === 'published'
                    ? 'No published sessions in this range. Try "Generate from routine".'
                    : 'No routine slots match this date range.'}
                </p>
              ) : (
                <>
                  <p className="font-medium">
                    {offlinePreview.sessionCount} session{offlinePreview.sessionCount !== 1 ? 's' : ''} ×{' '}
                    {offlinePreview.studentCount} student{offlinePreview.studentCount !== 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    {offlinePreview.sessions
                      .slice(0, 8)
                      .map((s) =>
                        new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        }),
                      )
                      .join(' · ')}
                    {offlinePreview.sessions.length > 8 && ` · +${offlinePreview.sessions.length - 8} more`}
                  </p>
                </>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!offlineStart || !offlineEnd || !!offlineDownloading}
              onClick={() => void runOfflineDownload('xlsx')}
            >
              {offlineDownloading === 'xlsx' ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Download Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!offlineStart || !offlineEnd || !!offlineDownloading}
              onClick={() => void runOfflineDownload('csv')}
            >
              {offlineDownloading === 'csv' ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Download CSV
            </Button>
          </div>
        </div>

        <div className="border-t" />

        <div className="space-y-3">
          <p className="text-sm font-medium">Import attendance from file</p>
          <p className="text-xs text-muted-foreground">
            Upload a filled Excel/CSV file. Accepts both the blank sheet format and flat row-per-record format.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] ?? null);
                setImportResult(null);
              }}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" />
              {importFile ? importFile.name : 'Choose file'}
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!importFile || importing}
              onClick={() => void runImport()}
            >
              {importing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
              Upload & Import
            </Button>
          </div>

          {importResult ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
              <p className="font-medium text-emerald-800">
                Imported {importResult.imported} record{importResult.imported !== 1 ? 's' : ''}
                {importResult.skipped > 0 && `, ${importResult.skipped} skipped`}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-rose-700">
                  {importResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                  {importResult.errors.length > 10 && <li>…and {importResult.errors.length - 10} more</li>}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
