export default function ReportsLoading() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-teal-100" />
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-32 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-40 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
