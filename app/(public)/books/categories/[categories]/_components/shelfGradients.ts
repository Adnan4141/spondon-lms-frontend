/** Tailwind gradient classes rotated per shelf row (via-stops for richer panels) */
export const CATEGORY_SHELF_GRADIENTS = [
  'from-rose-500 via-fuchsia-600 to-pink-700',
  'from-sky-400 via-blue-600 to-indigo-800',
  'from-emerald-400 via-teal-600 to-cyan-900',
  'from-amber-400 via-orange-500 to-rose-700',
  'from-violet-500 via-purple-600 to-fuchsia-800',
  'from-cyan-400 via-sky-600 to-blue-900',
] as const;

/** Soft tint for borders / rings that pair with each shelf */
export const CATEGORY_SHELF_RING_TINT = [
  'shadow-rose-500/25 ring-rose-200/60',
  'shadow-blue-500/25 ring-sky-200/70',
  'shadow-emerald-500/25 ring-emerald-200/60',
  'shadow-amber-500/25 ring-amber-200/60',
  'shadow-violet-500/25 ring-violet-200/60',
  'shadow-cyan-500/25 ring-cyan-200/60',
] as const;

export function shelfGradientClass(index: number): string {
  return CATEGORY_SHELF_GRADIENTS[index % CATEGORY_SHELF_GRADIENTS.length];
}

export function shelfRingClass(index: number): string {
  return CATEGORY_SHELF_RING_TINT[index % CATEGORY_SHELF_RING_TINT.length];
}
