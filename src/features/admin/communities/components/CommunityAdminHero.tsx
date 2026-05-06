import { DatabaseZap, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CommunityAdminHero({
  loading,
  seeding,
  onRefresh,
  onCreate,
  onSeed,
}: {
  loading: boolean;
  seeding: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onSeed: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-linear-to-r from-cyan-50 via-white to-emerald-50 p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Moderation Hub
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Communities & Doubts</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Create study spaces, review student posts, resolve doubts, and keep community conversations organized.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRefresh} className="rounded-xl border-slate-200 bg-white">
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" onClick={onSeed} disabled={seeding} className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
              <DatabaseZap className={cn('mr-2 h-4 w-4', seeding && 'animate-pulse')} />
              {seeding ? 'Seeding...' : 'Seed demo'}
            </Button>
            <Button onClick={onCreate} className="rounded-xl bg-slate-950 text-white hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
