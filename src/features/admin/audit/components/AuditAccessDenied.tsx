import { ShieldOff } from 'lucide-react';

export function AuditAccessDenied() {
  return (
    <main className="w-full min-w-0">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
          <ShieldOff className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-amber-900">Access restricted</p>
          <p className="text-xs font-medium text-amber-800/80">
            Audit history is available to Super Admin only.
          </p>
        </div>
      </div>
    </main>
  );
}
