import { z } from 'zod';
import type { Course, Program, SelCourseState } from '../types';
import { collectZodErrors, type EnrollmentValidationErrors } from './enrollment-modal-utils';

export type EnrollmentValidationInput = {
  programId: string;
  branchId: string;
  monthlyDiscount: string;
  oneTimeDiscount: string;
  admDiscount: string;
  payNowAmount: string;
  nextPaymentDueDate: Date | undefined;
  paymentMethod: 'CASH' | 'BKASH';
  selectedCourseCount: number;
};

export type EnrollmentValidationContext = {
  step: number;
  isMonthlyProgram: boolean;
  program: Program | undefined;
  selected: Course[];
  selCourses: Record<string, SelCourseState>;
  billingStart: string;
  totalFee: number;
  totalPayable: number;
  dueAfterPay: number;
};

export function validateEnrollment(
  input: EnrollmentValidationInput,
  ctx: EnrollmentValidationContext,
): { success: boolean; errors: EnrollmentValidationErrors } {
  const schema = z
    .object({
      programId: z.string().trim().min(1, 'Program is required'),
      branchId: z.string().trim().min(1, 'Branch is required'),
      monthlyDiscount: z.coerce
        .number()
        .refine(Number.isFinite, 'Monthly discount must be a valid amount')
        .min(0, 'Monthly discount cannot be negative'),
      oneTimeDiscount: z.coerce
        .number()
        .refine(Number.isFinite, 'One-time discount must be a valid amount')
        .min(0, 'One-time discount cannot be negative'),
      admDiscount: z.coerce
        .number()
        .refine(Number.isFinite, 'Admission discount must be a valid amount')
        .min(0, 'Admission discount cannot be negative'),
      payNowAmount: z.coerce
        .number()
        .refine(Number.isFinite, 'Pay now must be a valid amount')
        .min(0, 'Pay now cannot be negative'),
      nextPaymentDueDate: z.date().optional(),
      paymentMethod: z.enum(['CASH', 'BKASH']),
      selectedCourseCount: z.number().min(1, 'Select at least one course'),
    })
    .superRefine((draft, issueCtx) => {
      if (ctx.isMonthlyProgram && draft.monthlyDiscount > ctx.totalFee) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monthlyDiscount'],
          message: 'Monthly discount cannot exceed selected course total',
        });
      }
      if (!ctx.isMonthlyProgram && draft.oneTimeDiscount > ctx.totalFee) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['oneTimeDiscount'],
          message: 'One-time discount cannot exceed selected course total',
        });
      }
      if (ctx.program?.admissionFeeEnabled && draft.admDiscount > ctx.program.admissionFeeAmount) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['admDiscount'],
          message: 'Admission discount cannot exceed admission fee',
        });
      }
      if (draft.payNowAmount > ctx.totalPayable) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payNowAmount'],
          message: 'Pay now cannot exceed total payable',
        });
      }
      if (draft.payNowAmount > 0 && !draft.paymentMethod) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: 'Payment method is required when payment is collected',
        });
      }
      if (ctx.step === 2 && !ctx.isMonthlyProgram && ctx.dueAfterPay > 0 && !draft.nextPaymentDueDate) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nextPaymentDueDate'],
          message: 'Next due date is required when one-time enrollment has a due amount',
        });
      }
      for (const course of ctx.selected) {
        const selectedStartMonth =
          ctx.selCourses[course.id]?.startMonth || course.startMonth || ctx.billingStart;
        const selectedEndMonth = ctx.selCourses[course.id]?.endMonth || course.endMonth || '';
        if (course.type === 'OFFLINE' && !ctx.selCourses[course.id]?.batch) {
          issueCtx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`batch.${course.id}`],
            message: 'Batch is required for offline course',
          });
        }
        if (ctx.isMonthlyProgram) {
          if (!selectedStartMonth) {
            issueCtx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`startMonth.${course.id}`],
              message: 'Start month is required',
            });
          }
          if (!selectedEndMonth) {
            issueCtx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`endMonth.${course.id}`],
              message: 'End month is required',
            });
          }
          if (course.startMonth && selectedStartMonth && selectedStartMonth < course.startMonth) {
            issueCtx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`startMonth.${course.id}`],
              message: `Start month cannot be before ${course.startMonth}`,
            });
          }
          if (course.endMonth && selectedEndMonth && selectedEndMonth > course.endMonth) {
            issueCtx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`endMonth.${course.id}`],
              message: `End month cannot be after ${course.endMonth}`,
            });
          }
          if (selectedStartMonth && selectedEndMonth && selectedEndMonth < selectedStartMonth) {
            issueCtx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`endMonth.${course.id}`],
              message: 'End month cannot be before start month',
            });
          }
        }
      }
    });

  const result = schema.safeParse(input);
  return { success: result.success, errors: collectZodErrors(result) };
}
