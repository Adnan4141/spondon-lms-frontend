'use client';

import { useState } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background soft-grid">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-[32rem] w-[32rem] -translate-x-24 -translate-y-16 rounded-full bg-[radial-gradient(circle_at_center,_hsl(205_85%_92%),_transparent_65%)] [animation:float-slow_9s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] translate-x-20 translate-y-20 rounded-full bg-[radial-gradient(circle_at_center,_hsl(150_45%_90%),_transparent_65%)] [animation:float-slow_11s_ease-in-out_infinite]" />
      </div>

      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground/80 hover:bg-accent lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Spondon LMS</p>
                <h2 className="text-lg font-semibold tracking-tight">Administration</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-sm text-muted-foreground hover:bg-accent md:inline-flex"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground hover:bg-accent"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8 [animation:fade-up_.45s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
