export function CourseHubSkeleton() {
  return (
    <div className="mx-auto max-w-full space-y-5 animate-pulse">
      {/* Hero Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6">
        <div className="h-4 w-28 rounded-md bg-slate-200/70" />
        <div className="mt-5 flex flex-col gap-5 sm:flex-row">
          <div className="h-24 w-full max-w-[130px] shrink-0 rounded-2xl bg-slate-200/70 mx-auto sm:mx-0" />
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="h-7 w-2/3 max-w-sm rounded-md bg-slate-200/70 mx-auto sm:mx-0" />
            <div className="h-4 w-48 rounded-md bg-slate-200/70 mx-auto sm:mx-0" />
            <div className="h-2.5 w-full max-w-md rounded-full bg-slate-200/70 mx-auto sm:mx-0" />
            <div className="h-10 w-44 rounded-xl bg-slate-200/70 mx-auto sm:mx-0 mt-1" />
          </div>
        </div>
      </div>
      
      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-18 rounded-2xl bg-slate-200/40 border border-slate-100" />
        ))}
      </div>
      
      {/* Tabs list Skeleton */}
      <div className="h-11 rounded-xl bg-slate-200/30 border border-slate-100" />
      
      {/* Subjects/Lessons List Skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-200/40 border border-slate-100" />
      ))}
    </div>
  );
}
