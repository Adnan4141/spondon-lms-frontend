/**
 * Split a total amount across courses in proportion to each course fee.
 * Rounding is fixed so the sum of parts equals `totalToDistribute` (last course absorbs remainder).
 */
export function distributeProportionalByFee(
  courseIds: string[],
  feeByCourseId: (id: string) => number,
  totalToDistribute: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  const n = courseIds.length;
  if (n === 0) return result;

  const total = Math.max(0, Number(totalToDistribute) || 0);
  if (total === 0) {
    for (const id of courseIds) result[id] = 0;
    return result;
  }

  const fees = courseIds.map((id) => Math.max(0, feeByCourseId(id)));
  const sumFees = fees.reduce((a, b) => a + b, 0);
  const weights = sumFees > 0 ? fees.map((f) => f / sumFees) : courseIds.map(() => 1 / n);

  let allocated = 0;
  for (let i = 0; i < n; i++) {
    const id = courseIds[i];
    if (i === n - 1) {
      result[id] = Math.round((total - allocated) * 100) / 100;
    } else {
      const part = Math.round(total * weights[i] * 100) / 100;
      result[id] = part;
      allocated += part;
    }
  }
  return result;
}
