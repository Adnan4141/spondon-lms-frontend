import { describe, expect, it } from 'bun:test';
import { mapApiInvoicesToLocal } from './collect-payment-invoice-mapper';

describe('mapApiInvoicesToLocal', () => {
  it('maps monthly scholarship separately from settlement-derived discount totals', () => {
    const mapped = mapApiInvoicesToLocal(
      [
        {
          id: 'inv-1',
          month: '2026-07',
          payableAmount: 4800,
          paidAmount: 1500,
          status: 'PARTIAL',
          monthlyDiscountAmount: 1200,
          discountAmount: 0,
          settlementSummary: {
            discountAmount: 2700,
            waivedAmount: 0,
            settlementAmount: 0,
          },
          items: [
            {
              title: 'Monthly Fee: Chemistry',
              refId: 'course-1',
              unitPrice: 1800,
              qty: 1,
              type: 'COURSE',
              grossAmount: 1800,
              discountAmount: 480,
              payableAmount: 1320,
              paidAmount: 0,
              dueAmount: 1320,
            },
            {
              title: 'Admission Fee',
              refId: 'program-1',
              unitPrice: 1500,
              qty: 1,
              type: 'ADMISSION_FEE',
              grossAmount: 1500,
              payableAmount: 1500,
              paidAmount: 1500,
              dueAmount: 0,
            },
          ],
        },
      ],
      [
        {
          id: 'enrollment-1',
          programId: 'program-1',
          programName: 'HSC Academic 2026',
          branchId: 'branch-1',
          status: 'ACTIVE',
          billingType: 'MONTHLY',
          monthlyDiscount: 1200,
          billingStartMonth: '2026-07',
          courses: [{ courseId: 'course-1', batchId: null, status: 'ACTIVE', startMonth: '2026-07', endMonth: '2027-03', includeBook: false }],
        },
      ],
    );

    expect(mapped).toHaveLength(1);
    expect(mapped[0].monthlyDiscountAmount).toBe(1200);
    expect(mapped[0].discountAmount).toBe(0);
    expect(mapped[0].amount).toBe(4800);
    expect(mapped[0].paidAmount).toBe(1500);
  });
});
