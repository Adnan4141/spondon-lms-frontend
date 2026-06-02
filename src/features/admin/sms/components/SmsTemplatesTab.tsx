'use client';

import { FileText, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SmsTemplate } from '@/lib/api/sms';
import type { SmsTemplateActionsHook } from '../hooks/useSmsManagement';
import { EmptyState, Panel, SmsComposer, smsLengthInfo } from '../sms-shared';

const EMPTY_FORM = { key: '', body: '', isMasking: true };

export function SmsTemplatesTab({
  templates,
  templateState,
  templateActions,
}: {
  templates: SmsTemplate[];
  templateState: SmsTemplateActionsHook['state'];
  templateActions: SmsTemplateActionsHook['actions'];
}) {
  const { templateForm, submitting } = templateState;
  const { setTemplateForm, handleSaveTemplate } = templateActions;

  const isEditing = templates.some((t) => t.key === templateForm.key);
  const info = smsLengthInfo(templateForm.body);
  const hasContent = templateForm.key.trim() || templateForm.body.trim();

  function handleSelectTemplate(template: SmsTemplate) {
    setTemplateForm({ key: template.key, body: template.body, isMasking: template.isMasking });
  }

  function handleClear() {
    setTemplateForm(EMPTY_FORM);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      {/* ── Editor ── */}
      <Panel
        title="Template Editor"
        action={
          isEditing ? (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Editing: {templateForm.key}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-200 text-slate-500">
              New template
            </Badge>
          )
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Template key</Label>
            <Input
              placeholder="DUE_REMINDER_DEFAULT"
              value={templateForm.key}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, key: e.target.value }))}
              className="mt-1 bg-white font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Template body</Label>
              <span className="text-xs font-semibold text-slate-500">
                {info.length} chars · {Math.max(0, info.segments)} segment{info.segments === 1 ? '' : 's'} · {info.encoding}
              </span>
            </div>
            <SmsComposer
              label=""
              rows={8}
              value={templateForm.body}
              onChange={(body) => setTemplateForm((prev) => ({ ...prev, body }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
            <div>
              <Label>Masking default</Label>
              <p className="mt-0.5 text-xs text-slate-400">
                {templateForm.isMasking ? 'Sends as branded sender ID' : 'Sends as non-masking number'}
              </p>
            </div>
            <Switch
              checked={templateForm.isMasking}
              onCheckedChange={(checked) => setTemplateForm((prev) => ({ ...prev, isMasking: checked }))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handleSaveTemplate()}
              disabled={submitting || !templateForm.key.trim() || !templateForm.body.trim()}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Saving…' : isEditing ? 'Update Template' : 'Save Template'}
            </Button>
            {hasContent ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={submitting}
                className="gap-1.5 px-3"
                title="Clear editor"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </Panel>

      {/* ── Template list ── */}
      <Panel
        title="Templates"
        action={
          <span className="text-xs font-semibold text-slate-400">
            {templates.length} template{templates.length === 1 ? '' : 's'}
          </span>
        }
      >
        <div className="space-y-2">
          {templates.map((template) => {
            const isActive = templateForm.key === template.key;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template)}
                className={`group w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                    <p className={`truncate font-semibold ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                      {template.key}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <Badge
                      variant="outline"
                      className={
                        template.isMasking
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600'
                      }
                    >
                      {template.isMasking ? 'Masking' : 'Non-masking'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{template.body}</p>
              </button>
            );
          })}
          {templates.length === 0 && (
            <EmptyState>No templates yet. Use the editor to create one.</EmptyState>
          )}
        </div>
      </Panel>
    </div>
  );
}
