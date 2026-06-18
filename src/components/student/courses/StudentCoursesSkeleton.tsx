function RowSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-2xl border border-slate-200/60 bg-white p-4">
      <div className="h-20 w-28 shrink-0 rounded-xl bg-slate-200/70" />
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="h-4 w-24 rounded bg-slate-200/70" />
        <div className="h-5 w-3/4 max-w-xs rounded bg-slate-200/70" />
        <div className="h-2 w-full max-w-md rounded-full bg-slate-200/70" />
      </div>
    </div>
  );
}

export function StudentCoursesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-18 animate-pulse rounded-2xl bg-slate-200/40 border border-slate-100" />
        ))}
      </div>
      
      {/* Toolbar Skeleton */}
      <div className="h-14 rounded-2xl bg-slate-200/30 border border-slate-100 animate-pulse" />

      {/* Rows Skeletons */}
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
