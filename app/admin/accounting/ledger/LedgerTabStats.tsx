'use client';

type Props = {
  total: number;
  debitRowCount: number;
  creditRowCount: number;
  sourceCount: number;
  page: number;
  totalPages: number;
};

export function LedgerTabStats({
  total,
  debitRowCount,
  creditRowCount,
  sourceCount,
  page,
  totalPages,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Entries</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{total}</p>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-amber-700">Debit Entries</p>
        <p className="mt-1 text-2xl font-black text-amber-800">{debitRowCount}</p>
      </div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Credit Entries</p>
        <p className="mt-1 text-2xl font-black text-emerald-800">{creditRowCount}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Sources</p>
        <p className="mt-1 text-xl font-black text-slate-900">{sourceCount}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Page</p>
        <p className="mt-1 text-xl font-black text-slate-900">{page} / {Math.max(1, totalPages)}</p>
      </div>
    </div>
  );
}
