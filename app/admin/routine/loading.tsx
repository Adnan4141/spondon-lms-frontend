export default function RoutineLoading() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-teal-100" />
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-40 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
