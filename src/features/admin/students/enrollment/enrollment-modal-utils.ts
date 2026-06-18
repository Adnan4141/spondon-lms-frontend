import type { Course } from '../types';

export type EnrollmentValidationErrors = Partial<Record<string, string>>;

export function collectZodErrors(result: unknown): EnrollmentValidationErrors {
  const parsed = result as { success: boolean; error?: import('zod').ZodError };
  if (parsed.success || !parsed.error) return {};
  return parsed.error.issues.reduce<EnrollmentValidationErrors>((acc, issue) => {
    const key = issue.path.join('.') || 'form';
    acc[key] ??= issue.message;
    return acc;
  }, {});
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function moneyNumber(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function effectiveCourseFee(course: Course): number {
  return course.offerPrice !== null && course.offerPrice !== undefined
    ? moneyNumber(course.offerPrice)
    : moneyNumber(course.fee);
}

export function distributeEqualCents<T extends { due: number }>(items: T[], amount: number) {
  const dueByIndex = items.map((item) => Math.max(0, Math.round((Number(item.due) || 0) * 100)));
  const appliedByIndex = items.map(() => 0);
  let remaining = Math.max(0, Math.round((Number(amount) || 0) * 100));

  while (remaining > 0) {
    const activeIndexes = dueByIndex
      .map((due, index) => ({ due, index }))
      .filter((item) => item.due > 0)
      .map((item) => item.index);

    if (activeIndexes.length === 0) break;

    const baseShare = Math.floor(remaining / activeIndexes.length);
    const remainder = remaining % activeIndexes.length;
    let loopApplied = 0;

    activeIndexes.forEach((itemIndex, orderIndex) => {
      const desired = baseShare + (orderIndex < remainder ? 1 : 0);
      const used = Math.min(dueByIndex[itemIndex], desired);
      if (used <= 0) return;
      dueByIndex[itemIndex] -= used;
      appliedByIndex[itemIndex] += used;
      loopApplied += used;
    });

    if (loopApplied <= 0) break;
    remaining -= loopApplied;
  }

  return {
    remainingAmount: roundMoney(remaining / 100),
    appliedAmounts: appliedByIndex.map((value) => roundMoney(value / 100)),
  };
}
