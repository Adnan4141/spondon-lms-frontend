'use client';

import { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.14),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
      </div>

      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={cn(
          'relative transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[5.25rem]' : 'lg:pl-[19rem]'
        )}
      >
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 shadow-lg shadow-fuchsia-500/20 sm:flex">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="truncate bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                    Dashboard
                  </h2>
                </div>
                <p className="mt-1 text-sm text-white/45">
                  Welcome back, manage everything from one place
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="hidden h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white md:inline-flex"
              >
                <Search className="h-4 w-4" />
                <span>Search anything...</span>
              </button>

              <button
                type="button"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              </button>

              <button
                type="button"
                className="hidden h-11 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 pr-2 text-left transition hover:bg-white/10 sm:inline-flex"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 text-xs font-bold text-white shadow-lg">
                  AH
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">Adnan</p>
                  <p className="text-xs text-white/50">Administrator</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/50" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-md sm:p-5 lg:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}