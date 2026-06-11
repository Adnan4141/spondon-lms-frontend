export default function MonthlyBillingLoading() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-52 rounded-lg bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
