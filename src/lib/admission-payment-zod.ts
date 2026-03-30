import { z } from 'zod';

export const PAYMENT_METHODS = ['CASH', 'BKASH', 'BANK', 'GATEWAY'] as const;
export type AdmissionPaymentChannel = 'offline' | 'online';

export type AdmissionPaymentFields = {
  totalDiscountAmount: string;
  totalScholarshipAmount: string;
  totalPaymentAmount: string;
  discountReference: string;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  paymentTrxId: string;
};

/**
 * Validates totals: discount + scholarship ≤ course fees; payment ≤ net payable (offline only).
 */
export function validateAdmissionPayment(
  totalCourseFee: number,
  channel: AdmissionPaymentChannel,
  fields: AdmissionPaymentFields,
): { ok: true } | { ok: false; message: string } {
  const fee = Math.max(0, Number(totalCourseFee) || 0);
  const schema = z
    .object({
      totalDiscountAmount: z.string(),
      totalScholarshipAmount: z.string(),
      totalPaymentAmount: z.string(),
      discountReference: z.string(),
      paymentMethod: z.enum(PAYMENT_METHODS),
      paymentTrxId: z.string(),
    })
    .superRefine((data, ctx) => {
      const disc = Number(data.totalDiscountAmount) || 0;
      const schol = Number(data.totalScholarshipAmount) || 0;
      const pay = Number(data.totalPaymentAmount) || 0;
      if (disc < 0 || schol < 0 || pay < 0) {
        ctx.addIssue({ code: 'custom', message: 'Discount, scholarship, and payment cannot be negative.' });
        return;
      }
      if (disc + schol > fee + 1e-6) {
        ctx.addIssue({
          code: 'custom',
          message: `Discount plus scholarship cannot exceed total course fees (${fee.toFixed(2)} BDT).`,
        });
        return;
      }
      const net = Math.max(0, fee - disc - schol);
      if (channel === 'offline' && pay > net + 1e-6) {
        ctx.addIssue({
          code: 'custom',
          message: `Payment cannot exceed net payable after discount and scholarship (${net.toFixed(2)} BDT).`,
        });
        return;
      }
      if (channel === 'online' && pay > 1e-6) {
        ctx.addIssue({
          code: 'custom',
          message: 'For pay-online enrollment, collected amount today should be zero.',
        });
        return;
      }
      if (disc > 1e-6 && !data.discountReference.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Discount reference is required when discount is greater than zero.',
        });
        return;
      }
      if (channel === 'offline' && pay > 1e-6 && data.paymentMethod !== 'CASH' && !data.paymentTrxId.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Transaction or reference ID is required for non-cash payment.',
        });
        return;
      }
    });

  const parsed = schema.safeParse(fields);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message || 'Invalid payment details.' };
  }
  return { ok: true };
}

export function netPayableAfterAdjustments(totalCourseFee: number, discount: number, scholarship: number): number {
  const fee = Math.max(0, Number(totalCourseFee) || 0);
  const d = Math.max(0, Number(discount) || 0);
  const s = Math.max(0, Number(scholarship) || 0);
  return Math.max(0, Math.round((fee - d - s) * 100) / 100);
}
