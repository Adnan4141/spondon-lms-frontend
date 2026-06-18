function RowSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-xl border border-slate-200/60 bg-white p-4">
      <div className="h-20 w-28 shrink-0 rounded-lg bg-slate-200/70" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-4 w-24 rounded bg-slate-200/70" />
        <div className="h-5 w-3/4 max-w-xs rounded bg-slate-200/70" />
        <div className="h-1.5 w-full max-w-md rounded-full bg-slate-200/70" />
      </div>
    </div>
  );
}

export function StudentCoursesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-200/50" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
