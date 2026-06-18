import type { CreateLedgerEntryPayload } from '@/lib/api/accounting';
import type { SourceTypeValue } from './types';
import { parseAmount } from './utils';

export type LedgerEntryFormValues = {
  entryDate: string;
  flowType: CreateLedgerEntryPayload['flowType'];
  amount: string;
  accountId: string;
  toAccountId: string;
  sourceType: SourceTypeValue;
  sourceId: string;
  manualSourceLabel: string;
};

export function validateLedgerEntryForm(values: LedgerEntryFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const numericAmount = parseAmount(values.amount);

  if (!values.entryDate) errors.entryDate = 'Date is required.';
  if (!values.flowType) errors.flowType = 'Select an entry type.';
  if (!values.accountId) {
    errors.accountId =
      values.flowType === 'TRANSFER'
        ? 'Select the account money is moving from.'
        : 'Select an account.';
  }
  if (numericAmount <= 0) errors.amount = 'Amount must be greater than zero.';
  if (values.flowType === 'TRANSFER') {
    if (!values.toAccountId) errors.toAccountId = 'Select a destination account.';
    else if (values.toAccountId === values.accountId) {
      errors.toAccountId = 'Destination must differ from source account.';
    }
  }
  if (values.sourceType !== 'NONE' && values.sourceType !== 'OTHER' && !values.sourceId) {
    errors.sourceId = 'Select a source reference for the chosen source type.';
  }

  return errors;
}
