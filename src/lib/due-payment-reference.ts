export type DuePaymentReferenceMeta = {
  sourceInvoiceId: string;
  dueBefore: number;
  paidNow: number;
  remainingDue: number;
};

export function parseDuePaymentReference(reference?: string | null): DuePaymentReferenceMeta | null {
  if (!reference) return null;

  // Legacy format support: DUE_PAYMENT_FOR:<invoiceId>
  if (reference.startsWith('DUE_PAYMENT_FOR:')) {
    const sourceInvoiceId = reference.slice('DUE_PAYMENT_FOR:'.length).trim();
    if (!sourceInvoiceId) return null;
    return {
      sourceInvoiceId,
      dueBefore: 0,
      paidNow: 0,
      remainingDue: 0,
    };
  }

  // New format: DUE_PAYMENT|source=...|before=...|paid=...|remaining=...
  if (!reference.startsWith('DUE_PAYMENT|')) return null;
  const parts = reference.split('|').slice(1);
  const kv = new Map<string, string>();
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    kv.set(part.slice(0, idx), part.slice(idx + 1));
  }

  const sourceInvoiceId = kv.get('source') || '';
  if (!sourceInvoiceId) return null;

  const dueBefore = Number(kv.get('before') || 0);
  const paidNow = Number(kv.get('paid') || 0);
  const remainingDue = Number(kv.get('remaining') || 0);

  return {
    sourceInvoiceId,
    dueBefore: Number.isFinite(dueBefore) ? dueBefore : 0,
    paidNow: Number.isFinite(paidNow) ? paidNow : 0,
    remainingDue: Number.isFinite(remainingDue) ? remainingDue : 0,
  };
}
