import type { Exam } from '@/types/exam';
import { resolveExamWorkflow } from '@/lib/exam-workflow';

export function supportsWrittenEvaluation(exam: Exam | null) {
  return Boolean(resolveExamWorkflow(exam)?.supportsWrittenEvaluation);
}

export function supportsOfflineResults(exam: Exam | null) {
  return Boolean(resolveExamWorkflow(exam)?.supportsOfflineResults);
}

export function supportsOmrScan(exam: Exam | null) {
  return Boolean(resolveExamWorkflow(exam)?.supportsOmrScan);
}

export function parseBulkResultRows(input: string) {
  return input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rollNo, marksObtained, totalMarks, ...commentParts] = line.split(/[,\t]/).map((x) => x.trim());
      return {
        rollNo,
        marksObtained: Number(marksObtained || 0),
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
        comments: commentParts.join(' ').trim() || undefined,
      };
    })
    .filter((row) => row.rollNo);
}

export function getTabFromHash(hash: string, fallback: string) {
  const value = hash.replace(/^#/, '');
  return value || fallback;
}
