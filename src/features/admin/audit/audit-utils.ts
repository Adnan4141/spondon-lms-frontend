import type { AuditRow } from '@/lib/api/audit';

export type AuditCategory =
  | 'auth'
  | 'password'
  | 'enrollment'
  | 'sms'
  | 'exam'
  | 'payment'
  | 'user'
  | 'course'
  | 'cms'
  | 'default';

export type AuditCategoryTheme = {
  category: AuditCategory;
  label: string;
  accent: string;
  badge: string;
  dot: string;
  entity: string;
};

const CATEGORY_THEMES: Record<AuditCategory, AuditCategoryTheme> = {
  auth: {
    category: 'auth',
    label: 'Authentication',
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    entity: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  password: {
    category: 'password',
    label: 'Password',
    accent: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    dot: 'bg-amber-500',
    entity: 'bg-amber-50 text-amber-800 border-amber-100',
  },
  enrollment: {
    category: 'enrollment',
    label: 'Enrollment',
    accent: 'border-l-violet-500',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    dot: 'bg-violet-500',
    entity: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  sms: {
    category: 'sms',
    label: 'SMS',
    accent: 'border-l-cyan-500',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-500',
    entity: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  },
  exam: {
    category: 'exam',
    label: 'Exam / OMR',
    accent: 'border-l-indigo-500',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    entity: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  payment: {
    category: 'payment',
    label: 'Payment',
    accent: 'border-l-teal-500',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-500',
    entity: 'bg-teal-50 text-teal-700 border-teal-100',
  },
  user: {
    category: 'user',
    label: 'User',
    accent: 'border-l-sky-500',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    entity: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  course: {
    category: 'course',
    label: 'Course',
    accent: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    entity: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  cms: {
    category: 'cms',
    label: 'CMS / Website',
    accent: 'border-l-fuchsia-500',
    badge: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
    dot: 'bg-fuchsia-500',
    entity: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  },
  default: {
    category: 'default',
    label: 'System',
    accent: 'border-l-slate-400',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    entity: 'bg-slate-50 text-slate-600 border-slate-100',
  },
};

const ACTION_OVERRIDES: Record<string, AuditCategory> = {
  LOGIN_SUCCESS: 'auth',
  LOGIN_FAILED: 'auth',
  PASSWORD_RESET: 'password',
  PASSWORD_CHANGE_SELF: 'password',
  ENROLLMENT_STATUS_CHANGED: 'enrollment',
  ENROLLMENT_UPDATED: 'enrollment',
  ENROLLMENT_CANCELLED: 'enrollment',
  COURSE_CREATED: 'course',
  COURSE_UPDATED: 'course',
  COURSE_DELETED: 'course',
};

const ROLE_RING: Record<string, string> = {
  SUPER_ADMIN: 'ring-violet-300 bg-violet-600',
  BRANCH_ADMIN: 'ring-sky-300 bg-sky-600',
  TEACHER: 'ring-cyan-300 bg-cyan-600',
  STUDENT: 'ring-indigo-300 bg-indigo-600',
  ACCOUNTS: 'ring-emerald-300 bg-emerald-600',
  MODERATOR: 'ring-amber-300 bg-amber-600',
};

type AuditDisplay = { label?: string; slug?: string | null; id?: string };

function readDisplay(row: AuditRow): AuditDisplay | null {
  const nv = row.newValue as { _display?: AuditDisplay } | null | undefined;
  const ov = row.oldValue as { _display?: AuditDisplay } | null | undefined;
  return nv?._display ?? ov?._display ?? null;
}

export function getAuditCategory(action: string, entityType?: string): AuditCategory {
  if (ACTION_OVERRIDES[action]) return ACTION_OVERRIDES[action];
  if (entityType === 'Course' || /COURSE_/i.test(action)) return 'course';
  if (/HERO_|PROGRAM_CARD|TRUST_|SITE_|TESTIMONIAL|PARTNER|FAQ/i.test(`${action}${entityType}`)) return 'cms';
  if (/login|auth/i.test(action) || entityType === 'AUTH') return 'auth';
  if (/password/i.test(action)) return 'password';
  if (/enrollment/i.test(action)) return 'enrollment';
  if (/sms/i.test(action)) return 'sms';
  if (/omr|exam|result|merit|answer_sheet/i.test(action)) return 'exam';
  if (/payment|invoice|billing/i.test(action)) return 'payment';
  if (entityType === 'User') return 'user';
  return 'default';
}

export function getAuditTheme(action: string, entityType?: string): AuditCategoryTheme {
  return CATEGORY_THEMES[getAuditCategory(action, entityType)];
}

export function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditDateTime(value: string): {
  dateLine: string;
  timeLine: string;
  full: string;
} {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { dateLine: value, timeLine: '', full: value };
  const dateLine = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeLine = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { dateLine, timeLine, full: `${dateLine}, ${timeLine}` };
}

/** @deprecated use formatAuditDateTime */
export function formatDateTime(value: string) {
  const { dateLine, timeLine } = formatAuditDateTime(value);
  return { date: dateLine, time: timeLine };
}

export function shortId(id: string): string {
  if (!id || id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export function resolveEntityDisplay(row: AuditRow): {
  primary: string;
  secondary: string;
} {
  const display = readDisplay(row);
  if (display?.label) {
    const secondary = display.slug
      ? `${display.slug} · ${shortId(display.id ?? row.entityId)}`
      : shortId(display.id ?? row.entityId);
    return { primary: display.label, secondary };
  }
  return {
    primary: row.entityType,
    secondary: shortId(row.entityId),
  };
}

export function formatJson(value: unknown): string {
  if (value == null) return '';
  const stripMeta = (v: unknown): unknown => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const copy = { ...(v as Record<string, unknown>) };
      delete copy._meta;
      return copy;
    }
    return v;
  };
  try {
    return JSON.stringify(stripMeta(value), null, 2);
  } catch {
    return String(value);
  }
}

export function hasAuditValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value as object).filter((k) => k !== '_meta');
    return keys.length > 0;
  }
  return true;
}

export function readAuditMeta(row: AuditRow): { ip?: string; userAgent?: string } {
  const nv = row.newValue as { _meta?: { ip?: string; userAgent?: string } } | null | undefined;
  const ov = row.oldValue as { _meta?: { ip?: string; userAgent?: string } } | null | undefined;
  return nv?._meta ?? ov?._meta ?? {};
}

export function changeSummary(row: AuditRow): string | null {
  const display = readDisplay(row);
  const action = row.action;

  if (/COURSE_CREATED/i.test(action)) return display?.label ? `Course created: ${display.label}` : 'Course created';
  if (/COURSE_UPDATED/i.test(action)) return display?.label ? `Course updated: ${display.label}` : 'Course updated';
  if (/COURSE_DELETED/i.test(action)) return display?.label ? `Course deleted: ${display.label}` : 'Course deleted';
  if (/HERO_SLIDE/i.test(action)) return display?.label ? `Hero slide: ${display.label}` : 'Hero slide changed';
  if (/PROGRAM_CARD/i.test(action)) return display?.label ? `Program card: ${display.label}` : 'Program card changed';
  if (/SITE_SETTINGS/i.test(action)) return 'Website settings updated';
  if (/TESTIMONIAL/i.test(action)) return display?.label ? `Testimonial: ${display.label}` : 'Testimonial changed';
  if (/PARTNER/i.test(action)) return display?.label ? `Partner: ${display.label}` : 'Partner changed';
  if (/FAQ/i.test(action)) return display?.label ? `FAQ: ${display.label}` : 'FAQ changed';

  const nv = row.newValue as Record<string, unknown> | null | undefined;
  if (!nv || typeof nv !== 'object') return null;

  if (nv.passwordChanged === true) return 'Password was changed';
  if (typeof nv.status === 'string') return `Status → ${nv.status}`;
  if (typeof nv.reason === 'string') return nv.reason;
  if (typeof nv.mobile === 'string' && nv.status) return `Login ${String(nv.status).toLowerCase()}`;

  const keys = Object.keys(nv).filter((k) => !['_meta', '_display', 'ip', 'userAgent'].includes(k));
  if (keys.length === 1) return `${keys[0]} updated`;
  if (keys.length > 1 && keys.length <= 4) return keys.join(', ');
  return null;
}

export function actorInitials(name?: string | null): string {
  if (!name?.trim()) return 'SY';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function actorRingClass(role?: string | null): string {
  if (!role) return 'ring-slate-200 bg-slate-600';
  return ROLE_RING[role] ?? 'ring-slate-200 bg-slate-600';
}

export interface AuditFiltersState {
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  search: string;
  from: string;
  to: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFiltersState = {
  actorUserId: '',
  entityType: '',
  entityId: '',
  action: '',
  search: '',
  from: '',
  to: '',
};

export function countActiveFilters(filters: AuditFiltersState): number {
  return Object.values(filters).filter(Boolean).length;
}

export type CategoryChip = 'all' | 'course' | 'cms' | 'enrollment' | 'sms' | 'exam' | 'payment' | 'auth';

export function filtersForCategoryChip(chip: CategoryChip): Partial<AuditFiltersState> {
  switch (chip) {
    case 'course':
      return { entityType: 'Course', action: '', search: '' };
    case 'cms':
      return { entityType: '', action: '', search: 'SITE' };
    case 'enrollment':
      return { entityType: 'ENROLLMENT', action: '', search: '' };
    case 'sms':
      return { entityType: '', action: '', search: 'SMS' };
    case 'exam':
      return { entityType: 'Exam', action: '', search: '' };
    case 'payment':
      return { entityType: '', action: '', search: 'INVOICE' };
    case 'auth':
      return { entityType: 'AUTH', action: '', search: '' };
    default:
      return { entityType: '', action: '', search: '' };
  }
}
