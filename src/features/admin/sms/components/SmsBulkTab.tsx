'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Branch } from '@/lib/api/branches';
import type { SmsBulkActionsHook } from '../hooks/useSmsManagement';
import { EmptyState, Metric, Panel, SmsComposer } from '../sms-shared';

export function SmsBulkTab({
  branches,
  bulkState,
  bulkActions,
  directState,
}: {
  branches: Branch[];
  bulkState: SmsBulkActionsHook['bulkState'];
  bulkActions: SmsBulkActionsHook['bulkActions'];
  directState: SmsBulkActionsHook['directState'];
}) {
  const {
    bulkBranchId,
    bulkNumbers,
    bulkMessage,
    bulkPreview,
    bulkVariableButtons,
    renderedBulkSamples,
    estimatedBulkCredits,
    selectedBranchBalance,
    bulkPreviewFromFile,
    submitting,
  } = bulkState;
  const {
    setBulkBranchId,
    setBulkNumbers,
    setBulkMessage,
    setBulkFile,
    handleBulkPreview,
    applyBulkMobileColumn,
    handleBulkSend,
  } = bulkActions;
  const { direct, setDirect, handleDirectSend } = directState;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_.85fr]">
        <Panel title="Branch Bulk SMS">
          <div className="space-y-4">
            <div>
              <Label>Branch</Label>
              <Select value={bulkBranchId} onValueChange={setBulkBranchId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Bulk SMS deducts from this branch&apos;s balance only.{' '}
                {bulkBranchId ? (
                  <span className="font-semibold text-slate-700">
                    Branch balance:{' '}
                    {selectedBranchBalance !== undefined ? `${selectedBranchBalance} SMS` : '— (no balance row yet)'}
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <Label>Manual numbers</Label>
              <Textarea
                value={bulkNumbers}
                onChange={(event) => setBulkNumbers(event.target.value)}
                rows={5}
                placeholder="01700000001, 01700000002"
                className="mt-1 resize-y bg-white"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void handleBulkPreview('manual')}>
                  Preview
                </Button>
                <Button type="button" onClick={() => void handleBulkSend('manual')} disabled={submitting} className="gap-2">
                  <Send className="h-4 w-4" /> Queue Manual
                </Button>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <Label>Excel or CSV upload</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  setBulkFile(event.target.files?.[0] || null);
                }}
                className="mt-1 bg-white"
              />
              <p className="mt-1 text-xs text-slate-500">
                First sheet, first row = headers. Pick a file, then Preview before queueing.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void handleBulkPreview('file')}>
                  Preview File
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleBulkSend('file')}
                  disabled={submitting || !bulkPreview || !bulkPreviewFromFile}
                >
                  Queue File
                </Button>
              </div>
            </div>
            <SmsComposer
              label="Bulk message"
              value={bulkMessage}
              onChange={setBulkMessage}
              rows={5}
              variables={bulkVariableButtons}
            />
          </div>
        </Panel>
        <Panel title="Validation Preview">
          {bulkPreview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Valid" value={bulkPreview.validCount} tone="emerald" />
                <Metric label="Invalid" value={bulkPreview.invalidCount} tone="amber" />
                <Metric label="Duplicate" value={bulkPreview.duplicateCount} tone="slate" />
                <Metric label="Credits Needed" value={estimatedBulkCredits} tone="blue" />
              </div>
              {bulkBranchId ? (
                <p className="text-xs font-medium text-slate-700">
                  Selected branch balance:{' '}
                  <span className="text-slate-900">
                    {selectedBranchBalance !== undefined ? `${selectedBranchBalance} SMS` : '—'}
                  </span>
                </p>
              ) : null}
              <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
                Keep one recipient per row, use BD format 01XXXXXXXXX, and preview file uploads before queueing. Message samples below update as
                you type.
              </div>
              {bulkPreviewFromFile && bulkPreview.columns?.length ? (
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1 sm:min-w-[200px]">
                      <Label className="text-xs text-slate-600">Mobile column</Label>
                      <Select
                        value={
                          bulkPreview.mobileColumn && bulkPreview.columns?.includes(bulkPreview.mobileColumn)
                            ? bulkPreview.mobileColumn
                            : bulkPreview.columns[0] ?? ''
                        }
                        onValueChange={(col) => void applyBulkMobileColumn(col)}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {bulkPreview.columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">Override if the wrong column was auto-detected.</p>
                    </div>
                    <p className="text-xs text-slate-500 sm:pb-2">Headers: {bulkPreview.columns.join(', ')}</p>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">Click to insert variables</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {bulkPreview.columns.map((column) => (
                      <button
                        key={column}
                        type="button"
                        onClick={() =>
                          setBulkMessage(
                            `${bulkMessage}${bulkMessage && !bulkMessage.endsWith(' ') ? ' ' : ''}{{${column}}}`,
                          )
                        }
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {`{{${column}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {renderedBulkSamples.length > 0 ? (
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">Message samples (up to 5 rows)</p>
                  <p className="text-xs text-slate-500">Updates live when you change the message or mobile column.</p>
                  <div className="mt-2 space-y-2">
                    {renderedBulkSamples.map((message, index) => (
                      <p key={`${message}-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {message || 'Empty message'}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="max-h-56 overflow-auto rounded-md border border-slate-200">
                {bulkPreview.invalid.length > 0 ? (
                  bulkPreview.invalid.map((item) => (
                    <p key={item} className="border-b border-slate-100 px-3 py-2 text-sm text-red-600">
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No invalid numbers in preview.</p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState>Preview manual numbers or an Excel file to see valid, invalid, and duplicate counts.</EmptyState>
          )}
        </Panel>
      </div>
      <Panel title="Single Direct SMS">
        <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="space-y-3">
            <div>
              <Label>Recipient mobile</Label>
              <Input
                value={direct.to}
                onChange={(event) => setDirect((prev) => ({ ...prev, to: event.target.value }))}
                placeholder="01700000001"
                className="mt-1 bg-white"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={direct.scope}
                onValueChange={(value) => setDirect((prev) => ({ ...prev, scope: value, branchId: value === 'ORG' ? '' : prev.branchId }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORG">Central Balance</SelectItem>
                  <SelectItem value="BRANCH">Branch Balance</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={direct.branchId || 'none'}
                disabled={direct.scope !== 'BRANCH'}
                onValueChange={(value) => setDirect((prev) => ({ ...prev, branchId: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <Label>Masking</Label>
              <Switch checked={direct.isMasking} onCheckedChange={(checked) => setDirect((prev) => ({ ...prev, isMasking: checked }))} />
            </div>
          </div>
          <div className="space-y-3">
            <SmsComposer
              label="Direct message"
              value={direct.message}
              onChange={(message) => setDirect((prev) => ({ ...prev, message }))}
              rows={5}
              variables={['{{name}}', '{{amount}}', '{{month}}']}
            />
            <Button type="button" onClick={() => void handleDirectSend()} disabled={submitting} className="gap-2">
              <Send className="h-4 w-4" /> Queue Direct SMS
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
