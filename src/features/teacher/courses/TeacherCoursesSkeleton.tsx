function CardSkeleton() {
  return (
    <div className="flex max-h-[380px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="h-[140px] max-h-[150px] shrink-0 animate-pulse bg-slate-200/60 sm:h-[150px]" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200/70" />
        <div className="h-5 w-full animate-pulse rounded bg-slate-200/70" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/70" />
        <div className="mt-3 h-8 w-full animate-pulse rounded bg-slate-200/50" />
      </div>
    </div>
  );
}

export function TeacherCoursesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-slate-200/40" />
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-2xl bg-slate-200/30" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
