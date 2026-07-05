export function TeacherCourseDetailSkeleton() {
  return (
    <div className="space-y-6 pb-20">
      <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <div className="flex flex-col lg:flex-row">
          <div className="aspect-video w-full animate-pulse bg-slate-200/60 lg:w-72 lg:aspect-auto lg:min-h-[220px]" />
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200/70" />
            <div className="h-8 w-3/4 max-w-md animate-pulse rounded bg-slate-200/70" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-20 animate-pulse rounded-lg bg-slate-200/60" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-slate-200/50" />
        ))}
      </div>
      <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-slate-200/50" />
      {[1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/40" />
      ))}
    </div>
  );
}
