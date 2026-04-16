type CoursePriceLike = {
  fee?: unknown;
  offerPrice?: unknown | null;
};

/**
 * Pricing rule:
 * - If offerPrice is present, use it
 * - Otherwise use fee
 */
export function getEffectiveCoursePrice(course?: CoursePriceLike | null): number {
  if (!course) return 0;

  if (course.offerPrice !== null && course.offerPrice !== undefined) {
    const offer = Number(course.offerPrice);
    if (Number.isFinite(offer)) return offer;
  }

  const fee = Number(course.fee ?? 0);
  return Number.isFinite(fee) ? fee : 0;
}
