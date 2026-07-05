'use client';

import { BookMarked, BookOpen, CreditCard, Package } from 'lucide-react';

type Props = {
  orderCount: number;
  ebookCount: number;
  pendingPayments: number;
  catalogCount: number;
};

export function StudentBooksStats({
  orderCount,
  ebookCount,
  pendingPayments,
  catalogCount,
}: Props) {
  const items = [
    {
      label: 'Orders',
      value: orderCount,
      icon: Package,
      iconClass: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      label: 'E-books',
      value: ebookCount,
      icon: BookOpen,
      iconClass: 'bg-violet-500/20 text-violet-300',
    },
    {
      label: 'Due payment',
      value: pendingPayments,
      icon: CreditCard,
      iconClass: 'bg-amber-500/20 text-amber-300',
    },
    {
      label: 'In catalog',
      value: catalogCount,
      icon: BookMarked,
      iconClass: 'bg-emerald-500/20 text-emerald-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon, iconClass }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="text-xl font-black leading-none text-slate-900">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
