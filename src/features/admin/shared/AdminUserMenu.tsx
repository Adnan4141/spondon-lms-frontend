'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { clearAuthStorage, useAdminSession } from './admin-session';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

export function AdminUserMenu() {
  const router = useRouter();
  const { user, initials, roleLabel } = useAdminSession();

  const displayName = user?.fullName?.trim() || 'Signed in';
  const avatarUrl =
    user?.profileImage?.trim() &&
    resolveAttachmentUrl(user.profileImage.trim(), API_ORIGIN);

  const handleLogout = () => {
    clearAuthStorage();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-bold text-white shadow-sm transition-transform group-hover:rotate-6">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold">{initials}</span>
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-base font-bold leading-none text-slate-800">{displayName}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-tight text-indigo-500">
              {roleLabel}
            </p>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 transition-colors group-hover:text-indigo-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-bold text-slate-900">{displayName}</p>
          <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
        </DropdownMenuLabel>
        {(user?.email || user?.mobile) && (
          <>
            <DropdownMenuSeparator />
            {user?.email ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{user.email}</span>
              </div>
            ) : null}
            {user?.mobile ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{user.mobile}</span>
              </div>
            ) : null}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
