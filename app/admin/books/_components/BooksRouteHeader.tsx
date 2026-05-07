'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BarChart3, BookOpen, Boxes, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Catalog', href: '/admin/books', icon: BookOpen },
  { label: 'Offline Sales', href: '/admin/books/offline-sales', icon: ShoppingCart },
  { label: 'Online Orders', href: '/admin/books/orders', icon: BarChart3 },
  { label: 'Stock & Distribution', href: '/admin/books/stock', icon: Boxes },
] as const;

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function BooksRouteHeader({
  title,
  subtitle,
  eyebrow = 'Books',
  children,
}: Props) {
  const pathname = usePathname();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">{subtitle}</p> : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
      </div>

      <nav className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/admin/books'
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black transition-colors sm:px-4',
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
