import type { ComponentType } from 'react';
import {
  Building2,
  Calculator,
  Crown,
  MessageCircle,
  Presentation,
  Users,
} from 'lucide-react';

export const USERS_PAGE_SIZE = 20;
export const MIN_PASSWORD_LENGTH = 6;
export const ALL_STAFF_ROLES = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTS', 'TEACHER', 'MODERATOR'] as const;
export const BD_MOBILE = /^01[3-9]\d{8}$/;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  BRANCH_ADMIN: 'Branch Admin',
  ACCOUNTS: 'Accounts',
  TEACHER: 'Teacher',
  MODERATOR: 'Moderator',
  STUDENT: 'Student',
};

export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-50 text-violet-700 border-violet-200',
  BRANCH_ADMIN: 'bg-sky-50 text-sky-700 border-sky-200',
  ACCOUNTS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TEACHER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  MODERATOR: 'bg-amber-50 text-amber-700 border-amber-200',
  STUDENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const ROLE_CARD_STYLES: Record<
  string,
  { active: string; icon: ComponentType<{ className?: string }> }
> = {
  ALL: { active: 'border-slate-800 bg-slate-900 text-white shadow-slate-200', icon: Users },
  SUPER_ADMIN: { active: 'border-violet-500 bg-violet-600 text-white shadow-violet-100', icon: Crown },
  BRANCH_ADMIN: { active: 'border-sky-500 bg-sky-600 text-white shadow-sky-100', icon: Building2 },
  ACCOUNTS: { active: 'border-emerald-500 bg-emerald-600 text-white shadow-emerald-100', icon: Calculator },
  TEACHER: { active: 'border-cyan-500 bg-cyan-600 text-white shadow-cyan-100', icon: Presentation },
  MODERATOR: { active: 'border-amber-500 bg-amber-500 text-white shadow-amber-100', icon: MessageCircle },
};

export const USER_ROLE_TABS = [
  { key: 'ALL', label: 'All Users', roleKey: null },
  { key: 'SUPER_ADMIN', label: 'Super Admins', roleKey: 'SUPER_ADMIN' },
  { key: 'BRANCH_ADMIN', label: 'Branch Admins', roleKey: 'BRANCH_ADMIN' },
  { key: 'ACCOUNTS', label: 'Accounts', roleKey: 'ACCOUNTS' },
  { key: 'TEACHER', label: 'Teachers', roleKey: 'TEACHER' },
  { key: 'MODERATOR', label: 'Moderators', roleKey: 'MODERATOR' },
] as const;
