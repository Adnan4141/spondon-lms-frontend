'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, MessageSquareText, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getSmsTemplates, type SmsTemplate } from '@/lib/api/sms';
import { smsLengthInfo } from '../sms-shared';

export type SmsComposerValue = {
  message: string;
  smsType: 'masking' | 'non_masking';
  campaignName: string;
  scheduledAt?: string;
  templateKey?: string;
};

const DEFAULT_VARIABLES = ['name', 'roll', 'phone', 'course', 'batch', 'marks', 'total', 'grade', 'rank', 'amount', 'month', 'due_date', 'date', 'exam', 'institute'];

function roundToNextQuarter(date = new Date()) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  next.setMinutes(Math.ceil((minutes + 1) / 15) * 15);
  return next;
}

function toLocalDateTimeValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SmsComposerPanel({
  value,
  onChange,
  variables = DEFAULT_VARIABLES,
  rates,
  allowSchedule = true,
  templates,
  lockedTemplateKey,
}: {
  value: SmsComposerValue;
  onChange: (value: SmsComposerValue) => void;
  variables?: string[];
  rates: { maskingRate: number; nonMaskingRate: number };
  allowSchedule?: boolean;
  templates?: SmsTemplate[];
  lockedTemplateKey?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [loadedTemplates, setLoadedTemplates] = useState<SmsTemplate[]>([]);
  const [scheduleMode, setScheduleMode] = useState(value.scheduledAt ? 'later' : 'now');
  const availableTemplates = templates || loadedTemplates;

  useEffect(() => {
    if (templates) return;
    getSmsTemplates().then((res) => {
      if (res.success) setLoadedTemplates(res.data || []);
    }).catch(() => undefined);
  }, [templates]);

  const selectedTemplate = useMemo(
    () => availableTemplates.find((template) => template.key === value.templateKey),
    [availableTemplates, value.templateKey],
  );
  const length = smsLengthInfo(value.message);
  const rate = value.smsType === 'masking' ? rates.maskingRate : rates.nonMaskingRate;

  function update(patch: Partial<SmsComposerValue>) {
    onChange({ ...value, ...patch });
  }

  function insertVariable(variable: string) {
    const token = `{${variable}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      update({ message: `${value.message}${value.message && !value.message.endsWith(' ') ? ' ' : ''}${token}` });
      return;
    }
    const start = textarea.selectionStart ?? value.message.length;
    const end = textarea.selectionEnd ?? value.message.length;
    const next = `${value.message.slice(0, start)}${token}${value.message.slice(end)}`;
    update({ message: next });
    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <MessageSquareText className="h-4 w-4 text-blue-600" />
          Compose Message
        </h2>
        <span className="text-xs font-semibold text-slate-500">
          {length.length} chars | {Math.max(1, length.segments)} SMS | {length.encoding}
        </span>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Template</Label>
            <Select
              value={value.templateKey || 'custom'}
              disabled={!!lockedTemplateKey}
              onValueChange={(templateKey) => {
                if (templateKey === 'custom') update({ templateKey: undefined });
                else {
                  const template = availableTemplates.find((item) => item.key === templateKey);
                  update({ templateKey, message: template?.body || value.message });
                }
              }}
            >
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom message</SelectItem>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.id || template.key} value={template.key}>
                    {template.key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate ? <p className="mt-1 text-xs text-slate-500">Template is loaded into the message editor.</p> : null}
          </div>
          <div>
            <Label>Campaign</Label>
            <div className="relative mt-1">
              <Tag className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={value.campaignName} onChange={(event) => update({ campaignName: event.target.value })} className="pl-9" placeholder="Optional campaign name" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Message</Label>
            <span className="text-xs text-slate-500">Cost per SMS part: ৳{rate.toFixed(2)}</span>
          </div>
          <Textarea
            ref={textareaRef}
            value={value.message}
            onChange={(event) => update({ message: event.target.value })}
            rows={7}
            className="mt-2 min-h-44 resize-y bg-white"
            placeholder="Write your SMS message"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {variables.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {`{${variable}}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Masking</p>
              <p className="text-xs text-slate-500">{value.smsType === 'masking' ? 'Sender ID' : 'Non-masking number'}</p>
            </div>
            <Switch checked={value.smsType === 'masking'} onCheckedChange={(checked) => update({ smsType: checked ? 'masking' : 'non_masking' })} />
          </div>

          {allowSchedule ? (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarClock className="h-4 w-4 text-blue-600" />
                  Schedule
                </span>
                <Select
                  value={scheduleMode}
                  onValueChange={(mode) => {
                    setScheduleMode(mode);
                    update({ scheduledAt: mode === 'now' ? undefined : value.scheduledAt || roundToNextQuarter().toISOString() });
                  }}
                >
                  <SelectTrigger className="h-8 w-32 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send now</SelectItem>
                    <SelectItem value="later">Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduleMode === 'later' ? (
                <Input
                  type="datetime-local"
                  min={toLocalDateTimeValue(roundToNextQuarter())}
                  value={value.scheduledAt ? toLocalDateTimeValue(new Date(value.scheduledAt)) : toLocalDateTimeValue(roundToNextQuarter())}
                  onChange={(event) => update({ scheduledAt: event.target.value ? new Date(event.target.value).toISOString() : undefined })}
                  className="mt-2 h-9 bg-white text-xs"
                />
              ) : (
                <p className="mt-2 text-xs text-slate-500">Queued immediately. Timezone: BST (Asia/Dhaka).</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">Instant send</p>
              <p className="text-xs text-slate-500">Direct SMS does not use scheduling.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
