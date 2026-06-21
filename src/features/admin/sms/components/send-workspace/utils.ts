import type { SmsRecipient } from '@/lib/api/sms';
import type { DirectRecipientMode, SendMethod } from './types';

export const STUDENT_SMS_VARIABLES = [
  'name',
  'phone',
  'roll',
  'registrationNumber',
  'primaryMobile',
  'secondaryMobile',
  'fatherName',
  'fatherMobile',
  'motherName',
  'motherMobile',
  'branch',
  'course',
  'batch',
  'institute',
];

export const RAW_SMS_VARIABLES = ['phone', 'institute'];

export function renderTemplate(template: string, vars: Record<string, unknown>) {
  return template.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (_match, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

export function recipientKey(recipient: SmsRecipient, index?: number) {
  return recipient.id || recipient.phone || String(index ?? '');
}

export const DUE_SMS_VARIABLES = ['name', 'program', 'month', 'phone', 'institute'];

export function variablesForComposer(args: {
  method: SendMethod;
  bulkVariables: string[];
  directMode?: DirectRecipientMode;
  focused?: boolean;
  recipientVariant?: 'default' | 'due';
}) {
  if (args.recipientVariant === 'due') return DUE_SMS_VARIABLES;
  if (args.method === 'bulk') return args.bulkVariables;
  if (args.method === 'manual') return RAW_SMS_VARIABLES;
  if (args.method === 'direct') return args.directMode === 'raw' ? RAW_SMS_VARIABLES : STUDENT_SMS_VARIABLES;
  return STUDENT_SMS_VARIABLES;
}
