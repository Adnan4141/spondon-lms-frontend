import type { User } from '@/lib/api/users';
import {
  Ban,
  Building2,
  Calendar,
  Eye,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROLE_COLORS, ROLE_LABELS } from '../users-constants';
import { formatUserDate, getInitials } from '../users-page-utils';

type UsersTableProps = {
  loading: boolean;
  users: User[];
  page: number;
  pagination: { page: number; limit: number; total: number; pages: number } | null;
  onPageChange: (page: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleBlock: (user: User) => void;
  onDelete: (user: User) => void;
};

export function UsersTable({
  loading,
  users,
  page,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onResetPassword,
  onToggleBlock,
  onDelete,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-sm font-bold">Loading users…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Users className="h-12 w-12 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">No users found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90">
                <tr>
                  {['User', 'Role', 'Branch', 'Contact', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-sky-50/40">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-sm">
                          {getInitials(user.fullName)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 transition-colors group-hover:text-sky-800">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">{user.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          'rounded-full border text-[10px] font-black uppercase px-2.5 py-0.5 whitespace-nowrap',
                          ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700',
                        )}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.branch ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Building2 className="h-3.5 w-3.5 text-sky-500" />
                          {user.branch.name}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {user.mobile}
                        </div>
                        {user.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                          user.status === 'ACTIVE'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700',
                        )}
                      >
                        {user.status === 'ACTIVE' ? '● Active' : '○ Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatUserDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onView(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-700"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                          title="Reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleBlock(user)}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                            user.status === 'ACTIVE'
                              ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600',
                          )}
                          title={user.status === 'ACTIVE' ? 'Block user' : 'Activate user'}
                        >
                          {user.status === 'ACTIVE' ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <p className="text-sm font-black text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages || loading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
