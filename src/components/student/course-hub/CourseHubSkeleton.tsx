export function CourseHubSkeleton() {
  return (
    <div className="mx-auto max-w-full space-y-4 animate-pulse">
      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5">
        <div className="h-4 w-28 rounded bg-slate-200/70" />
        <div className="mt-4 flex gap-4">
          <div className="h-20 w-[112px] shrink-0 rounded-xl bg-slate-200/70" />
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="h-6 w-2/3 max-w-sm rounded bg-slate-200/70" />
            <div className="h-4 w-48 rounded bg-slate-200/70" />
            <div className="h-2 w-full max-w-md rounded-full bg-slate-200/70" />
            <div className="h-9 w-40 rounded-lg bg-slate-200/70" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-xl bg-slate-200/40" />
        ))}
      </div>
      <div className="h-10 rounded-lg bg-slate-200/50" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[88px] rounded-xl bg-slate-200/40" />
      ))}
    </div>
  );
}
