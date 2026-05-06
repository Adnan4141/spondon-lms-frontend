'use client';

import { Bell, Command, Menu, Search } from 'lucide-react';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminUserMenu } from './AdminUserMenu';

interface AdminHeaderProps {
  onMenuOpen: () => void;
}

export function AdminHeader({ onMenuOpen }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl" />

      <div className="relative mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 lg:px-10">
        {/* Left: mobile hamburger + breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            <AdminBreadcrumbs />
          </div>
        </div>

        {/* Centre: search bar */}
        <div className="mx-8 hidden max-w-md flex-1 md:flex">
          <div className="group relative w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Quick Search… (⌘K)"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100/30 pl-11 pr-12 text-base font-medium outline-none ring-indigo-500/10 transition-all focus:border-indigo-500/40 focus:bg-white focus:ring-4"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 shadow-sm">
              <Command className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400">K</span>
            </div>
          </div>
        </div>

        {/* Right: notification bell + user menu */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-bounce rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <AdminUserMenu />
        </div>
      </div>
    </header>
  );
}
