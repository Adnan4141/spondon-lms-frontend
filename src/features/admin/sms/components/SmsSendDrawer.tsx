'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, Eye, Hash, MessageSquareText, Send, Type, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dispatchSms, type SmsRecipient } from '@/lib/api/sms';
import { smsLengthInfo } from '../sms-shared';

const VARIABLES = ['name', 'phone', 'course', 'batch', 'amount', 'date', 'grade', 'exam', 'institute'];

function renderTemplate(template: string, vars: Record<string, unknown>) {
  return template.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (_match, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

function asText(value: unknown, fallback = '') {
  if (value == null) return fallback;
  return String(value);
}

function formatSmsType(value: 'masking' | 'non_masking') {
  return value === 'masking' ? 'Masking' : 'Non-masking';
}

export function SmsSendDrawer({
  open,
  onOpenChange,
  recipients,
  templateKey,
  defaultMessage,
  defaultVars = {},
  contextLabel,
  context = 'manual',
  branchId,
  scope = branchId ? 'BRANCH' : 'ORG',
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: SmsRecipient[];
  templateKey?: string;
  defaultMessage?: string;
  defaultVars?: Record<string, unknown>;
  contextLabel: string;
  context?: string;
  branchId?: string;
  scope?: 'ORG' | 'BRANCH';
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState(defaultMessage || 'Dear {name}, ');
  const [smsType, setSmsType] = useState<'masking' | 'non_masking'>('masking');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(defaultMessage || 'Dear {name}, ');
    setSmsType('masking');
    setPreviewIndex(0);
  }, [defaultMessage, open]);

  useEffect(() => {
    if (previewIndex >= recipients.length) setPreviewIndex(0);
  }, [previewIndex, recipients.length]);

  const previewRecipient = recipients[previewIndex];
  const previewVariables = useMemo(() => ({
    ...defaultVars,
    ...(previewRecipient?.variables || {}),
    name: previewRecipient?.name || previewRecipient?.variables?.name || '',
    phone: previewRecipient?.phone || '',
  }), [defaultVars, previewRecipient]);

  const firstPreview = useMemo(() => renderTemplate(message, previewVariables), [message, previewVariables]);

  const samplePreviews = useMemo(() => recipients.slice(0, 50).map((recipient) => ({
    key: recipient.id || recipient.phone,
    name: asText(recipient.name || recipient.variables?.name, 'Recipient'),
    phone: recipient.phone,
    rendered: renderTemplate(message, {
      ...defaultVars,
      ...(recipient.variables || {}),
      name: recipient.name || recipient.variables?.name || '',
      phone: recipient.phone || '',
    }),
  })), [defaultVars, message, recipients]);

  const length = smsLengthInfo(firstPreview);
  const segmentCount = Math.max(1, length.segments);
  const rate = smsType === 'masking' ? Number(defaultVars.maskingRate || 0.5) : Number(defaultVars.nonMaskingRate || 0.35);
  const estimatedCost = Math.round(recipients.length * segmentCount * rate * 100) / 100;
  const canSend = recipients.length > 0 && message.trim().length > 0 && !submitting;
  const scopeLabel = scope === 'BRANCH' ? 'Branch balance' : 'Central balance';

  function insertVariable(variable: string) {
    const token = `{${variable}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${token}`);
      return;
    }

    const start = textarea.selectionStart ?? message.length;
    const end = textarea.selectionEnd ?? message.length;
    const next = `${message.slice(0, start)}${token}${message.slice(end)}`;
    setMessage(next);
    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function recipientName(recipient: SmsRecipient) {
    return asText(recipient.name || recipient.variables?.name, 'Recipient');
  }

  function selectedPreviewLabel() {
    if (!previewRecipient) return 'No recipient selected';
    return `${recipientName(previewRecipient)} · ${previewRecipient.phone}`;
  }

  const metrics = [
    { label: 'Recipients', value: recipients.length.toLocaleString(), icon: Users, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Characters', value: length.length.toLocaleString(), icon: Type, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Parts', value: segmentCount.toLocaleString(), icon: Hash, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Estimate', value: `৳${estimatedCost.toFixed(2)}`, icon: Calculator, tone: 'bg-emerald-50 text-emerald-700' },
  ];

  async function handleSend() {
    const trimmedMessage = message.trim();
    if (!recipients.length) {
      toast({ title: 'No recipients selected', variant: 'destructive' });
      return;
    }
    if (!trimmedMessage) {
      toast({ title: 'Message is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatchSms({
        recipients,
        message: trimmedMessage,
        templateKey,
        defaultVars,
        smsType,
        context,
        scope,
        branchId,
        type: context.toUpperCase(),
        source: context === 'manual' ? 'DIRECT' : 'SYSTEM',
      });
      toast({
        title: res.message || `${res.data.queuedCount} SMS queued`,
        description: `Estimated cost ৳${Number(res.data.estimatedCost ?? estimatedCost).toFixed(2)}`,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to send SMS', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        aria-label="Close SMS drawer"
        onClick={() => onOpenChange(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {contextLabel}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  {scopeLabel}
                </Badge>
              </div>
              <h2 className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-950">
                <MessageSquareText className="h-5 w-5 text-blue-600" />
                Queue SMS
              </h2>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <div>
              <Label>SMS type</Label>
              <Select value={smsType} onValueChange={(value) => setSmsType(value as 'masking' | 'non_masking')}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masking">Masking</SelectItem>
                  <SelectItem value="non_masking">Non-masking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preview recipient</Label>
              <Select value={String(previewIndex)} onValueChange={(value) => setPreviewIndex(Number(value))}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="Select preview recipient" />
                </SelectTrigger>
                <SelectContent>
                  {recipients.length ? (
                    recipients.slice(0, 50).map((recipient, index) => (
                      <SelectItem key={`${recipient.id || recipient.phone}-${index}`} value={String(index)}>
                        {recipientName(recipient)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>
                      No recipients
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">
                {formatSmsType(smsType)} · {length.encoding} · ৳{rate.toFixed(2)} per SMS part · {selectedPreviewLabel()}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Message</Label>
              <span className="text-xs font-semibold text-slate-500">{length.length} chars</span>
            </div>
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              className="mt-2 min-h-44 resize-y bg-white"
              placeholder="Write your SMS message"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {VARIABLES.map((variable) => (
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

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                <Eye className="h-3.5 w-3.5" />
                Resolved Preview
              </p>
              <span className="text-xs text-slate-500">{selectedPreviewLabel()}</span>
            </div>
            <p className="mt-3 min-h-16 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800">
              {firstPreview || 'Message preview will appear here.'}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-bold uppercase text-slate-500">Recipient Preview</p>
              <span className="text-xs text-slate-500">Showing {Math.min(recipients.length, 50)} of {recipients.length}</span>
            </div>
            <div className="max-h-64 overflow-auto">
              {recipients.length ? (
                recipients.slice(0, 50).map((recipient, index) => (
                  <button
                    key={`${recipient.id || recipient.phone}-${index}`}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50 ${
                      index === previewIndex ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-900">{recipientName(recipient)}</span>
                      {samplePreviews[index] ? (
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{samplePreviews[index].rendered}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{recipient.phone}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-8 text-center text-sm text-slate-500">No recipients selected.</p>
              )}
              {recipients.length > 50 ? <p className="px-3 py-2 text-xs text-slate-500">+{recipients.length - 50} more recipients</p> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Queues {recipients.length.toLocaleString()} {formatSmsType(smsType).toLowerCase()} SMS via {scopeLabel.toLowerCase()}.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="button" disabled={!canSend} onClick={() => void handleSend()} className="gap-2">
                <Send className="h-4 w-4" />
                {submitting ? 'Queueing...' : 'Queue SMS'}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
