import { UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CommunityEmptyState({ onCreate, onSeed }: { onCreate: () => void; onSeed: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
        <UsersRound className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">No communities found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Create a new student discussion space or seed demo communities to preview the moderation workflow.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={onCreate} className="rounded-xl bg-slate-950 text-white hover:bg-slate-800">Create Community</Button>
        <Button variant="outline" onClick={onSeed} className="rounded-xl">Seed demo</Button>
      </div>
    </div>
  );
}
