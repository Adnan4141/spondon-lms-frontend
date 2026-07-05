function CardSkeleton() {
  return (
    <div className="flex max-h-[400px] animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
      <div className="h-[160px] max-h-[180px] shrink-0 rounded-xl bg-slate-200/70 sm:h-[180px]" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-16 rounded bg-slate-200/70" />
        <div className="h-5 w-full rounded bg-slate-200/70" />
        <div className="h-4 w-2/3 rounded bg-slate-200/70" />
        <div className="mt-4 h-8 w-24 rounded bg-slate-200/70" />
      </div>
    </div>
  );
}

export function StudentBooksSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[4.5rem] animate-pulse rounded-2xl border border-slate-100 bg-slate-200/40"
          />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-200/30" />
      <div className="h-11 animate-pulse rounded-2xl border border-slate-100 bg-slate-200/30" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
