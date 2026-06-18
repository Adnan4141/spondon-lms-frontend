import type { User } from '@/lib/api/users';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Building2, Calendar, Mail, Phone, ShieldCheck } from 'lucide-react';
import { ROLE_COLORS, ROLE_LABELS } from '../users-constants';
import { formatUserDate, getInitials } from '../users-page-utils';

export function UserDetailView({ user }: { user: User }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {getInitials(user.fullName)}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">{user.fullName}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge
              className={cn(
                'rounded-full border text-[10px] font-black uppercase px-2 py-0.5',
                ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700',
              )}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            <Badge
              variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}
              className={cn(
                'rounded-full text-[10px] font-black uppercase',
                user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : '',
              )}
            >
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: 'Mobile', value: user.mobile, icon: Phone },
          { label: 'Email', value: user.email || '—', icon: Mail },
          { label: 'Branch', value: user.branch?.name ?? 'Unassigned', icon: Building2 },
          { label: 'Joined', value: formatUserDate(user.createdAt), icon: Calendar },
          { label: 'User ID', value: `${user.id.slice(0, 12)}…`, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="text-sm font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
