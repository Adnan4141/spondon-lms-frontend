'use client';

import { Loader2 } from 'lucide-react';

export function BooksCatalogLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        বইয়ের তালিকা লোড হচ্ছে…
      </div>
    </div>
  );
}
