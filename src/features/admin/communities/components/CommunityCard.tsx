import { Eye, Pencil, Power, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { Community } from '@/lib/api/community';
import { cn } from '@/lib/utils';
import { getCommunityVisibilityMeta } from './community-admin-utils';

export function CommunityCard({
  community,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  community: Community;
  onOpen: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const visibility = getCommunityVisibilityMeta(community.visibility);
  const VisibilityIcon = visibility.icon;
  const thumb = community.thumbnail ? resolveAttachmentUrl(community.thumbnail, API_ORIGIN) : '';

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-36 bg-linear-to-br from-cyan-100 via-white to-emerald-100">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={community.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-black text-cyan-900/20">
            {community.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase', visibility.badgeClass)}>
            {visibility.label}
          </Badge>
          <Badge className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-black uppercase',
            community.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white',
          )}>
            {community.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-slate-950">{community.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{community.description || 'No description added yet.'}</p>
          </div>
          <div className={cn('rounded-xl p-2', visibility.iconClass)}>
            <VisibilityIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {community.course ? <Badge variant="outline" className="rounded-full border-slate-200">{community.course.name}</Badge> : null}
          <Badge variant="outline" className="rounded-full border-slate-200 text-slate-500">/{community.slug}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Members" value={community._count?.members || 0} />
          <Metric label="Posts" value={community._count?.posts || 0} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button size="sm" variant="outline" onClick={onOpen} className="rounded-xl"><Eye className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={onEdit} className="rounded-xl"><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={onToggleStatus} className="rounded-xl"><Power className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="rounded-xl text-rose-600 hover:text-rose-700"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
