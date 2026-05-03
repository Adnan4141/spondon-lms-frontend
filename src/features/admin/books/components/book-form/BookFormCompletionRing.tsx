export function BookFormCompletionRing({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500/15 to-teal-600/10 text-xs font-black tabular-nums text-emerald-800 ring-2 ring-emerald-500/25 dark:text-emerald-200 dark:ring-emerald-400/30"
      aria-hidden
    >
      {v}
    </div>
  );
}
