import { z } from 'zod';

export const PAYMENT_METHODS = ['CASH', 'BKASH'] as const;
export type AdmissionPaymentChannel = 'offline' | 'online';

export type AdmissionPaymentFields = {
  totalDiscountAmount: string;
  totalPaymentAmount: string;
  discountReference: string;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  paymentTrxId: string;
};

export type ValidateAdmissionPaymentOptions = {
  /** Extra one-time reductions (e.g. monthly discount on first invoice) counted against the same gross as `discountableBillableAmount`. */
  otherDiscountAmount?: number;
  /** Charges that are never reduced by discounts (e.g. admission fee); added back to net payable after discounts. */
  admissionFeePortion?: number;
};

/**
 * Validates totals: discounts apply only to `discountableBillableAmount` (course fees, books, etc.).
 * Net payable = max(0, discountable − discounts) + (admissionFeePortion ?? 0). Payment must not exceed that net (offline).
 */
export function validateAdmissionPayment(
  discountableBillableAmount: number,
  channel: AdmissionPaymentChannel,
  fields: AdmissionPaymentFields,
  options?: ValidateAdmissionPaymentOptions,
): { ok: true } | { ok: false; message: string } {
  const fee = Math.max(0, Number(discountableBillableAmount) || 0);
  const otherDisc = Math.max(0, Number(options?.otherDiscountAmount) || 0);
  const admissionPortion = Math.max(0, Number(options?.admissionFeePortion) || 0);
  const schema = z
    .object({
      totalDiscountAmount: z.string(),
      totalPaymentAmount: z.string(),
      discountReference: z.string(),
      paymentMethod: z.enum(PAYMENT_METHODS),
      paymentTrxId: z.string(),
    })
    .superRefine((data, ctx) => {
      const disc = Number(data.totalDiscountAmount) || 0;
      const pay = Number(data.totalPaymentAmount) || 0;
      if (disc < 0 || pay < 0) {
        ctx.addIssue({ code: 'custom', message: 'Discount and payment cannot be negative.' });
        return;
      }
      const totalDisc = disc + otherDisc;
      if (totalDisc > fee + 1e-6) {
        ctx.addIssue({
          code: 'custom',
          message: `Total discounts cannot exceed discountable fees (${fee.toFixed(2)} BDT; admission fee is not discounted).`,
        });
        return;
      }
      const net = Math.max(0, fee - totalDisc) + admissionPortion;
      if (channel === 'offline' && pay > net + 1e-6) {
        ctx.addIssue({
          code: 'custom',
          message: `Payment cannot exceed net payable after discount (${net.toFixed(2)} BDT).`,
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

export function netPayableAfterAdjustments(totalCourseFee: number, discount: number): number {
  const fee = Math.max(0, Number(totalCourseFee) || 0);
  const d = Math.max(0, Number(discount) || 0);
  return Math.max(0, Math.round((fee - d) * 100) / 100);
}
