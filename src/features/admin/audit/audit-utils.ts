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
  LOGIN_OTP_REQUIRED: 'auth',
  DEVICE_TRUSTED: 'auth',
  DEVICE_REVOKED: 'auth',
  DEVICE_REVOKED_BY_ADMIN: 'auth',
  ALL_DEVICES_REVOKED: 'auth',
  BOOK_STOCK_MOVEMENT_DELETE: 'books',
  LOGIN_FAILED: 'auth',
  PASSWORD_RESET: 'password',
  PASSWORD_CHANGE_SELF: 'password',
  ENROLLMENT_STATUS_CHANGED: 'enrollment',
  ENROLLMENT_UPDATED: 'enrollment',
  ENROLLMENT_CANCELLED: 'enrollment',
  COURSE_CREATED: 'course',
  COURSE_UPDATED: 'course',
  COURSE_DELETED: 'course',
  'exam.results.omr.upload': 'exam',
  'exam.results.omr.review': 'exam',
  'exam.results.omr.finalize': 'exam',
  'exam.results.written.evaluate': 'exam',
  'exam.results.written.finalize': 'exam',
};

const EXAM_RESULTS_ACTION_LABELS: Record<string, string> = {
  'exam.results.omr.upload': 'OMR scan upload',
  'exam.results.omr.review': 'OMR scan review',
  'exam.results.omr.finalize': 'OMR batch finalized',
  'exam.results.written.evaluate': 'Written evaluation',
  'exam.results.written.finalize': 'Written evaluation finalized',
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
  return EXAM_RESULTS_ACTION_LABELS[action]
    ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
  const payload = getPayloadForPanel(value);
  if (payload == null) return '';
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
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

export type ParsedUserAgent = {
  browser: string;
  version: string;
  os: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  raw: string;
};

export function parseUserAgent(ua?: string | null): ParsedUserAgent | null {
  if (!ua?.trim()) return null;
  const raw = ua.trim();

  let browser = 'Unknown browser';
  let version = '';

  const edge = raw.match(/Edg\/(\d+)/);
  const opera = raw.match(/OPR\/(\d+)/);
  const firefox = raw.match(/Firefox\/(\d+)/);
  const chrome = raw.match(/Chrome\/(\d+)/);
  const safari = raw.match(/Version\/(\d+)[^)]*Safari/);

  if (edge) {
    browser = 'Microsoft Edge';
    version = edge[1];
  } else if (opera) {
    browser = 'Opera';
    version = opera[1];
  } else if (firefox) {
    browser = 'Firefox';
    version = firefox[1];
  } else if (safari && /Safari/.test(raw) && !chrome) {
    browser = 'Safari';
    version = safari[1];
  } else if (chrome) {
    browser = 'Chrome';
    version = chrome[1];
  }

  let os = 'Unknown OS';
  if (/Windows NT 10/.test(raw)) os = 'Windows';
  else if (/Windows NT 6\.3/.test(raw)) os = 'Windows 8.1';
  else if (/Windows NT 6\.1/.test(raw)) os = 'Windows 7';
  else if (/Mac OS X/.test(raw)) os = 'macOS';
  else if (/Android (\d+)/.test(raw)) {
    const m = raw.match(/Android (\d+)/);
    os = m ? `Android ${m[1]}` : 'Android';
  } else if (/iPhone|iPad|iPod/.test(raw)) os = 'iOS';
  else if (/CrOS/.test(raw)) os = 'Chrome OS';
  else if (/Linux/.test(raw)) os = 'Linux';

  let device: ParsedUserAgent['device'] = 'Desktop';
  if (/iPad|Tablet/i.test(raw)) device = 'Tablet';
  else if (/Mobile|iPhone|iPod|Android.*Mobile/i.test(raw)) device = 'Mobile';

  return { browser, version, os, device, raw };
}

export function formatIpDisplay(ip?: string | null): { primary: string; secondary?: string } {
  if (!ip?.trim()) return { primary: '—' };
  const v = ip.trim();
  if (v === '::1') return { primary: 'Localhost', secondary: 'IPv6 loopback · ::1' };
  if (v === '127.0.0.1') return { primary: 'Localhost', secondary: 'IPv4 loopback · 127.0.0.1' };
  if (v.startsWith('::ffff:')) {
    const mapped = v.slice(7);
    return { primary: mapped, secondary: `IPv4-mapped · ${v}` };
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return { primary: v, secondary: 'IPv4 address' };
  if (v.includes(':')) return { primary: v, secondary: 'IPv6 address' };
  return { primary: v };
}

export type AuditConnectionInfo = {
  ip?: string;
  userAgent?: string;
  mobile?: string;
  status?: string;
  reason?: string | null;
};

export function readConnectionInfo(row: AuditRow): AuditConnectionInfo {
  const nv = row.newValue as Record<string, unknown> | null | undefined;
  const ov = row.oldValue as Record<string, unknown> | null | undefined;
  const meta = readAuditMeta(row);

  const pick = (key: string) => {
    const fromNv = nv?.[key];
    const fromOv = ov?.[key];
    if (typeof fromNv === 'string') return fromNv;
    if (typeof fromOv === 'string') return fromOv;
    return undefined;
  };

  return {
    ip: row.ip || meta.ip || pick('ip'),
    userAgent: meta.userAgent || pick('userAgent'),
    mobile: pick('mobile'),
    status: pick('status'),
    reason: (nv?.reason ?? ov?.reason ?? null) as string | null | undefined,
  };
}

const PANEL_EXCLUDED_KEYS = new Set(['ip', 'userAgent', 'mobile', 'status', 'reason', '_meta', '_display']);

export function getPayloadForPanel(value: unknown): unknown | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  const copy = { ...(value as Record<string, unknown>) };
  for (const key of PANEL_EXCLUDED_KEYS) delete copy[key];
  return Object.keys(copy).length > 0 ? copy : null;
}

export function changeSummary(row: AuditRow): string | null {
  const display = readDisplay(row);
  const action = row.action;

  if (/COURSE_CREATED/i.test(action)) return display?.label ? `Course created: ${display.label}` : 'Course created';
  if (/COURSE_UPDATED/i.test(action)) return display?.label ? `Course updated: ${display.label}` : 'Course updated';
  if (/COURSE_DELETED/i.test(action)) return display?.label ? `Course deleted: ${display.label}` : 'Course deleted';
  if (/HERO_SLIDE/i.test(action)) return display?.label ? `Hero slide: ${display.label}` : 'Hero slide changed';
  if (/PROGRAM_CARD/i.test(action)) return display?.label ? `Program card: ${display.label}` : 'Program card changed';
  if (/SITE_SETTINGS_ACCESSED/i.test(action)) return 'Site settings page opened';
  if (/SITE_SETTINGS_UPDATED/i.test(action)) {
    const nv = row.newValue as { changedKeyCount?: number; keys?: string[] } | null | undefined;
    const count = nv?.changedKeyCount ?? nv?.keys?.length;
    if (typeof count === 'number' && count > 0) {
      return `Website settings updated (${count} key${count === 1 ? '' : 's'})`;
    }
    return 'Website settings updated';
  }
  if (/ENROLLMENT_COURSE_ADDED|ENROLLMENT_COURSE_REMOVED|ENROLLMENT_BATCH_CHANGED/i.test(action)) {
    const payload = (row.newValue ?? row.oldValue) as {
      courseName?: string;
      studentName?: string;
      branchName?: string;
      effectiveMonth?: string;
      status?: string;
    } | null;
    const parts: string[] = [];
    if (payload?.courseName) parts.push(payload.courseName);
    if (payload?.studentName) parts.push(payload.studentName);
    if (payload?.branchName) parts.push(payload.branchName);
    if (payload?.effectiveMonth) parts.push(`from ${payload.effectiveMonth}`);
    if (payload?.status) parts.push(`→ ${payload.status}`);
    return parts.length > 0 ? parts.join(' · ') : actionLabel(action);
  }
  if (/ENROLLMENT_FULL_RESET/i.test(action)) {
    const ov = row.oldValue as { counts?: Record<string, number>; totals?: Record<string, number> } | null | undefined;
    const counts = ov?.counts;
    const totals = ov?.totals;
    const parts: string[] = ['Enrollment full reset (destructive)'];
    if (counts) {
      const summary = [
        counts.courses != null ? `${counts.courses} course(s)` : null,
        counts.invoices != null ? `${counts.invoices} invoice(s)` : null,
        counts.payments != null ? `${counts.payments} payment(s)` : null,
      ].filter(Boolean);
      if (summary.length > 0) parts.push(summary.join(', '));
    }
    if (totals?.dueTotal != null) parts.push(`due ${totals.dueTotal}`);
    return parts.join(' · ');
  }
  if (/TESTIMONIAL/i.test(action)) return display?.label ? `Testimonial: ${display.label}` : 'Testimonial changed';
  if (/PARTNER/i.test(action)) return display?.label ? `Partner: ${display.label}` : 'Partner changed';
  if (/FAQ/i.test(action)) return display?.label ? `FAQ: ${display.label}` : 'FAQ changed';

  if (/^exam\.results\.omr\./i.test(action)) {
    const nv = row.newValue as Record<string, unknown> | null | undefined;
    const detail = typeof nv?.action === 'string' ? nv.action.replace(/_/g, ' ') : null;
    const batchId = nv?.batchId ?? nv?.resultBatchId;
    const scanId = nv?.scanId;
    const parts = [actionLabel(action)];
    if (detail) parts.push(detail);
    if (batchId) parts.push(`batch ${shortId(String(batchId))}`);
    if (scanId) parts.push(`scan ${shortId(String(scanId))}`);
    if (typeof nv?.marks === 'number') parts.push(`${nv.marks} marks`);
    if (typeof nv?.totalScans === 'number') parts.push(`${nv.totalScans} sheet(s)`);
    return parts.join(' · ');
  }
  if (/^exam\.results\.written\./i.test(action)) {
    const nv = row.newValue as Record<string, unknown> | null | undefined;
    const parts = [actionLabel(action)];
    if (typeof nv?.action === 'string') parts.push(String(nv.action).replace(/_/g, ' '));
    if (nv?.attemptId) parts.push(`attempt ${shortId(String(nv.attemptId))}`);
    if (nv?.subPartKey) parts.push(`part ${String(nv.subPartKey)}`);
    if (typeof nv?.marksAwarded === 'number') parts.push(`${nv.marksAwarded} marks`);
    if (typeof nv?.obtainedMarks === 'number') parts.push(`total ${nv.obtainedMarks}`);
    if (nv?.resultBatchId) parts.push(`batch ${shortId(String(nv.resultBatchId))}`);
    return parts.join(' · ');
  }

  const nv = row.newValue as Record<string, unknown> | null | undefined;
  const ov = row.oldValue as Record<string, unknown> | null | undefined;
  if (!nv || typeof nv !== 'object') return null;

  const branchLabel = (payload: Record<string, unknown>) => {
    if (typeof payload.branchName === 'string' && payload.branchName.trim()) {
      return typeof payload.branchId === 'string' && payload.branchId
        ? `${payload.branchName} (${shortId(payload.branchId)})`
        : payload.branchName;
    }
    if (typeof payload.toBranchName === 'string' && payload.toBranchName.trim()) {
      return typeof payload.toBranchId === 'string' && payload.toBranchId
        ? `${payload.toBranchName} (${shortId(payload.toBranchId)})`
        : payload.toBranchName;
    }
    return null;
  };

  if (/SMS_BALANCE/i.test(action)) {
    const branch = branchLabel(nv) || (ov ? branchLabel(ov) : null);
    const count = nv.count ?? ov?.count;
    const parts = [actionLabel(action)];
    if (branch) parts.push(branch);
    if (count != null) parts.push(`count ${count}`);
    return parts.join(' · ');
  }

  const payloadBranch = branchLabel(nv);
  if (payloadBranch && Object.keys(nv).filter((k) => !['_meta', '_display', 'branchName', 'toBranchName', 'fromBranchName', 'collectedByBranchName'].includes(k)).length <= 3) {
    const extras = Object.entries(nv)
      .filter(([k]) => !['branchId', 'branchName', 'toBranchId', 'toBranchName', 'fromBranchId', 'fromBranchName', '_meta', '_display'].includes(k))
      .map(([k, v]) => `${k}: ${String(v)}`);
    return [payloadBranch, ...extras].join(' · ');
  }

  if (nv.passwordChanged === true) return 'Password was changed';
  if (typeof nv.status === 'string') return `Status → ${nv.status}`;
  if (typeof nv.reason === 'string') return nv.reason;
  if (typeof nv.mobile === 'string' && nv.status) {
    return `Login ${String(nv.status).toLowerCase()} · ${nv.mobile}`;
  }

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
  actorRole: string;
  branchId: string;
  entityType: string;
  entityId: string;
  action: string;
  search: string;
  from: string;
  to: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFiltersState = {
  actorUserId: '',
  actorRole: '',
  branchId: '',
  entityType: '',
  entityId: '',
  action: '',
  search: '',
  from: '',
  to: '',
};

export const AUDIT_ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'BRANCH_ADMIN', label: 'Branch Admin' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ACCOUNTS', label: 'Accounts' },
  { value: 'MODERATOR', label: 'Moderator' },
];

export const AUDIT_ENTITY_OPTIONS = [
  { value: '', label: 'All entity types' },
  { value: 'Course', label: 'Course' },
  { value: 'ENROLLMENT', label: 'Enrollment' },
  { value: 'Enrollment', label: 'Enrollment (legacy)' },
  { value: 'SiteSetting', label: 'Site Setting' },
  { value: 'AUTH', label: 'Auth' },
  { value: 'User', label: 'User' },
  { value: 'HeroSlide', label: 'Hero Slide' },
  { value: 'ProgramCard', label: 'Program Card' },
  { value: 'Testimonial', label: 'Testimonial' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Faq', label: 'FAQ' },
  { value: 'Exam', label: 'Exam' },
];

export const AUDIT_ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'LOGIN_OTP_REQUIRED', label: 'Login OTP Required' },
  { value: 'DEVICE_TRUSTED', label: 'Device Trusted' },
  { value: 'DEVICE_REVOKED', label: 'Device Revoked' },
  { value: 'DEVICE_REVOKED_BY_ADMIN', label: 'Device Revoked By Admin' },
  { value: 'ALL_DEVICES_REVOKED', label: 'All Devices Revoked' },
  { value: 'BOOK_STOCK_MOVEMENT_DELETE', label: 'Stock Movement Deleted' },
  { value: 'SITE_SETTINGS_ACCESSED', label: 'Site Settings Accessed' },
  { value: 'SITE_SETTINGS_UPDATED', label: 'Site Settings Updated' },
  { value: 'ENROLLMENT_COURSE_ADDED', label: 'Enrollment Course Added' },
  { value: 'ENROLLMENT_COURSE_REMOVED', label: 'Enrollment Course Removed' },
  { value: 'ENROLLMENT_BATCH_CHANGED', label: 'Enrollment Batch Changed' },
  { value: 'ENROLLMENT_FULL_RESET', label: 'Enrollment Full Reset' },
  { value: 'ENROLLMENT_CANCELLED', label: 'Enrollment Cancelled' },
  { value: 'COURSE_CREATED', label: 'Course Created' },
  { value: 'COURSE_UPDATED', label: 'Course Updated' },
  { value: 'COURSE_DELETED', label: 'Course Deleted' },
];

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
