export default function QuestionsLoading() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-violet-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-slate-50" />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
