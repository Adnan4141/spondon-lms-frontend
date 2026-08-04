/** Visible placeholder while public page content streams in (avoids blank white main). */
export function PublicContentSkeleton() {
  return (
    <div className="w-full animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="aspect-[9/4] w-full bg-slate-200 md:max-h-[65vh]" />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-12 lg:px-12">
        <div className="mx-auto h-4 w-32 rounded-full bg-slate-200" />
        <div className="mx-auto h-10 w-72 max-w-full rounded-2xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
