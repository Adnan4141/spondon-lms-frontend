import type { ComponentType } from 'react';
import { Archive, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Community, CommunityPost } from '@/lib/api/community';
import type { DoubtThread } from '@/lib/api/doubts';
import { cn } from '@/lib/utils';

type Tone = 'cyan' | 'emerald' | 'violet' | 'amber';

const toneClass: Record<Tone, string> = {
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
};

export function CommunityKpiGrid({
  communities,
  posts,
  doubts,
}: {
  communities: Community[];
  posts: CommunityPost[];
  doubts: DoubtThread[];
}) {
  const members = communities.reduce((sum, community) => sum + (community._count?.members || 0), 0);
  const communityPosts = communities.reduce((sum, community) => sum + (community._count?.posts || 0), 0);
  const rows: Array<{ label: string; value: number; icon: ComponentType<{ className?: string }>; tone: Tone; hint: string }> = [
    { label: 'Communities', value: communities.length, icon: Users, tone: 'cyan', hint: 'Active spaces' },
    { label: 'Members', value: members, icon: ShieldCheck, tone: 'emerald', hint: 'Joined learners' },
    { label: 'Posts', value: communityPosts || posts.length, icon: MessageSquare, tone: 'violet', hint: 'Feed activity' },
    { label: 'Open doubts', value: doubts.filter((doubt) => doubt.status === 'OPEN').length, icon: Archive, tone: 'amber', hint: 'Need attention' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(({ label, value, icon: Icon, tone, hint }) => (
        <Card key={label} className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>
            </div>
            <div className={cn('rounded-2xl p-3 ring-1', toneClass[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
