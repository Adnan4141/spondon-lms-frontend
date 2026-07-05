import { ApiError } from './api';

export const STUDENT_ONLY_COURSE_PURCHASE_MESSAGE =
  'Only student profiles can enroll in and purchase this course. Please log in with a student account to continue.';

export const STUDENT_ONLY_BOOK_PURCHASE_MESSAGE =
  'Only student profiles can purchase books online. Please log in with a student account to continue.';

const STUDENT_ONLY_MESSAGE_PATTERN =
  /only student (accounts|profiles) can (use this endpoint|make purchases|purchase books|access this feature|enroll)/i;

export function getStoredUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const role = JSON.parse(raw)?.role;
    return typeof role === 'string' && role ? role.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function isStudentRole(role?: string | null): boolean {
  return String(role || '').toUpperCase() === 'STUDENT';
}

export function isLoggedInNonStudent(): boolean {
  const role = getStoredUserRole();
  return Boolean(role && !isStudentRole(role));
}

export function isStudentOnlyRestriction(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 403) {
    return STUDENT_ONLY_MESSAGE_PATTERN.test(err.message);
  }
  if (err instanceof Error) {
    return STUDENT_ONLY_MESSAGE_PATTERN.test(err.message);
  }
  return false;
}

export function resolveStudentOnlyMessage(err: unknown, message: string, fallback = 'Something went wrong. Please try again.'): string {
  if (isStudentOnlyRestriction(err)) return message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
