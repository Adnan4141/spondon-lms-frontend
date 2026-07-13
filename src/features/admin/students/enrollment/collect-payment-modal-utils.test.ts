import { describe, expect, it } from 'bun:test';
import { resolveInvoiceDue } from './collect-payment-modal-utils';
import type { Invoice } from '../types';

function makeInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    billingType: 'MONTHLY',
    programId: 'program-1',
    programName: 'HSC Academic 2026',
    month: '2026-07',
    amount: 3300,
    paidAmount: 1500,
    status: 'PARTIAL',
    dueDate: '',
    items: [],
    ...overrides,
  };
}

describe('resolveInvoiceDue', () => {
  it('uses line-item due totals when items are enriched', () => {
    const due = resolveInvoiceDue(
      makeInvoice({
        amount: 3300,
        paidAmount: 1500,
        items: [
          {
            title: 'Chemistry',
            refId: 'c1',
            unitPrice: 1800,
            qty: 1,
            payableAmount: 1320,
            paidAmount: 0,
            dueAmount: 1320,
          },
          {
            title: 'Admission',
            refId: 'p1',
            unitPrice: 1500,
            qty: 1,
            type: 'ADMISSION_FEE',
            payableAmount: 1500,
            paidAmount: 1500,
            dueAmount: 0,
          },
        ],
      }),
    );
    expect(due).toBe(1320);
  });

  it('falls back to header payable minus paid when no items exist', () => {
    const due = resolveInvoiceDue(makeInvoice({ amount: 4800, paidAmount: 1500, items: [] }));
    expect(due).toBe(3300);
  });
});
