export default function LandingLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 animate-pulse bg-slate-100" />
      <div className="h-[300px] animate-pulse bg-slate-200 sm:h-[480px] md:h-[620px] lg:h-[720px]" />
      <div className="mx-auto max-w-7xl space-y-4 px-6 py-16">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
