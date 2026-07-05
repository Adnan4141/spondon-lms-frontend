export type ExamPortal = 'admin' | 'teacher';

export function examListPath(portal: ExamPortal): string {
  return portal === 'teacher' ? '/teacher/exams' : '/admin/exam';
}

export function examNewPath(portal: ExamPortal): string {
  return portal === 'teacher' ? '/teacher/exam/new' : '/admin/exam/new';
}

export function examBasePath(portal: ExamPortal, examId: string): string {
  return `${portal === 'teacher' ? '/teacher/exam' : '/admin/exam'}/${examId}`;
}

export function examSetupPath(portal: ExamPortal, examId: string): string {
  return `${examBasePath(portal, examId)}/setup`;
}

export function examPapersPath(portal: ExamPortal, examId: string): string {
  return `${examBasePath(portal, examId)}/papers`;
}

export function examResultsPath(portal: ExamPortal, examId: string): string {
  return `${examBasePath(portal, examId)}/results`;
}

export function examLeaderboardPath(portal: ExamPortal, examId: string): string {
  return `${examBasePath(portal, examId)}/leaderboard`;
}

export function isTeacherExamFullBleedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/teacher/exam/new') return true;
  return pathname.startsWith('/teacher/exam/') && pathname !== '/teacher/exam';
}

export function detectExamPortalFromPath(pathname: string | null): ExamPortal {
  if (pathname?.startsWith('/teacher/exam')) return 'teacher';
  return 'admin';
}
