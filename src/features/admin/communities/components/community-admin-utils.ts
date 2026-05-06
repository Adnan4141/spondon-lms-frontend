import { Globe, Lock, ShieldCheck } from 'lucide-react';
import type { Community } from '@/lib/api/community';

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function slugifyCommunityName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCommunityVisibilityMeta(visibility: Community['visibility'] | string) {
  if (visibility === 'PUBLIC') {
    return {
      label: 'Public',
      icon: Globe,
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
      iconClass: 'bg-sky-50 text-sky-700',
    };
  }
  if (visibility === 'COURSE_ONLY') {
    return {
      label: 'Course only',
      icon: ShieldCheck,
      badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
      iconClass: 'bg-violet-50 text-violet-700',
    };
  }
  return {
    label: 'Members only',
    icon: Lock,
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
    iconClass: 'bg-slate-100 text-slate-700',
  };
}
