import type { Exam } from '@/types/exam';

export function supportsWrittenEvaluation(exam: Exam | null) {
  return Boolean(exam && ['WRITTEN', 'HYBRID', 'OFFLINE'].includes(exam.mode));
}

export function supportsOfflineResults(exam: Exam | null) {
  return Boolean(exam && (exam.mode === 'OFFLINE' || exam.settings?.examWorkflow?.method === 'OFFLINE_RESULT'));
}

export function supportsOmrScan(exam: Exam | null) {
  return Boolean(exam && (exam.resultInputModes ?? []).includes('OMR_SCAN'));
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
