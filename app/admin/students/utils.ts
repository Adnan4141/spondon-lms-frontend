import { API_ORIGIN } from '@/lib/api';
import type { Enrollment as ApiEnrollment } from '@/lib/api/enrollments';
import type { Course, CourseWithDiscount, Enrollment } from './types';

export const fmt = (n: number | string) => '৳' + Number(n || 0).toLocaleString('en-BD');

export const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
};

export const fmtMonth = (m: string) => {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en', { month: 'short', year: 'numeric' });
};

export function normPdfUrl(raw: string): string {
  return raw.startsWith('http') ? raw : `${API_ORIGIN}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

export function toLocalEnrollment(e: ApiEnrollment): Enrollment {
  return {
    id: e.id,
    programId: e.programId,
    branchId: e.branchId,
    status: (['ACTIVE', 'WAITLISTED'].includes(e.status as string) ? 'ACTIVE' : 'CANCELLED') as 'ACTIVE' | 'CANCELLED',
    billingType: (e.billingType ?? 'MONTHLY') as 'MONTHLY' | 'ONE_TIME',
    monthlyDiscount: Number(e.monthlyDiscount ?? 0),
    billingStartMonth: e.billingStartMonth ?? '',
    courses: (e.enrollmentCourses ?? []).map(ec => ({
      id: ec.id,
      courseId: ec.courseId,
      batchId: ec.batchId ?? null,
      status: 'ACTIVE' as const,
      startMonth: (ec as { startMonth?: string | null }).startMonth ?? ec.course?.startMonth ?? '',
      endMonth: (ec as { endMonth?: string | null }).endMonth ?? ec.course?.endMonth ?? '',
      includeBook: ec.includeBook,
    })),
  };
}

export function distributeDiscount(courses: Course[], total: number): CourseWithDiscount[] {
  const sum = courses.reduce((s, c) => s + c.fee, 0);
  if (!sum || !total) return courses.map(c => ({ ...c, discount: 0 }));
  let rem = Math.round(total);
  return courses.map((c, i) => {
    if (i === courses.length - 1) return { ...c, discount: rem };
    const d = Math.floor((c.fee / sum) * total);
    rem -= d;
    return { ...c, discount: d };
  });
}

export function avatarHue(name: string) {
  return (name || '?').charCodeAt(0) * 13 % 360;
}
