export default function AdminLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
        </div>
        <div className="h-10 w-full rounded-xl bg-slate-100 sm:w-28" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-24 rounded bg-slate-200" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <div className="h-72 rounded-xl bg-slate-100" />
        <div className="h-72 rounded-xl bg-slate-100" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-64 rounded-xl bg-slate-100" />
        <div className="h-64 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
