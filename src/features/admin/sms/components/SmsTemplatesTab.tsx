'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SmsTemplate } from '@/lib/api/sms';
import type { SmsTemplateActionsHook } from '../hooks/useSmsManagement';
import { EmptyState, Panel, SmsComposer } from '../sms-shared';

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

  return (
    <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      <Panel title="Template Editor">
        <div className="space-y-3">
          <div>
            <Label>Template key</Label>
            <Input
              placeholder="DUE_REMINDER_DEFAULT"
              value={templateForm.key}
              onChange={(event) => setTemplateForm((prev) => ({ ...prev, key: event.target.value }))}
              className="mt-1 bg-white"
            />
          </div>
          <SmsComposer label="Template body" rows={8} value={templateForm.body} onChange={(body) => setTemplateForm((prev) => ({ ...prev, body }))} />
          <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
            <Label>Masking default</Label>
            <Switch
              checked={templateForm.isMasking}
              onCheckedChange={(checked) => setTemplateForm((prev) => ({ ...prev, isMasking: checked }))}
            />
          </div>
          <Button type="button" onClick={() => void handleSaveTemplate()} disabled={submitting} className="gap-2">
            <Save className="h-4 w-4" /> Save Template
          </Button>
        </div>
      </Panel>
      <Panel title="Templates">
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => setTemplateForm({ key: template.key, body: template.body, isMasking: template.isMasking })}
            >
              <p className="truncate font-semibold text-slate-950">{template.key}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{template.body}</p>
            </button>
          ))}
          {templates.length === 0 && <EmptyState>No templates created yet.</EmptyState>}
        </div>
      </Panel>
    </div>
  );
}
