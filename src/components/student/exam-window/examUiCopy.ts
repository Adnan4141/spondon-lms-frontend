export type Lang = 'bn' | 'en';

export const isBanglaText = (v?: string | null): boolean => {
  if (!v) return false;
  return /[\u0980-\u09FF]/.test(v);
};

export const detectQuestionLang = (
  question?: { prompt?: string; options?: { text?: string }[] } | null,
  fallback: Lang = 'en',
): Lang => {
  const prompt = question?.prompt || '';
  const optionText = (question?.options || []).map((o) => o?.text || '').join(' ');
  const combined = `${prompt} ${optionText}`;
  return isBanglaText(combined) ? 'bn' : fallback;
};

const bnOptionLetters: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'ক',
  B: 'খ',
  C: 'গ',
  D: 'ঘ',
};

export const getOptionLabel = (label: string, lang: Lang): string => {
  if (lang === 'bn') {
    const upper = label?.toUpperCase?.() || label;
    if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D') return bnOptionLetters[upper as 'A' | 'B' | 'C' | 'D'];
    return label;
  }
  const bnToEn: Record<string, 'A' | 'B' | 'C' | 'D'> = {
    [bnOptionLetters.A]: 'A',
    [bnOptionLetters.B]: 'B',
    [bnOptionLetters.C]: 'C',
    [bnOptionLetters.D]: 'D',
  };
  return bnToEn[label] ?? label;
};

export const getExamUiStrings = (lang: Lang) => {
  if (lang === 'en') {
    return {
      loading: 'Loading exam...',
      loginToTakeExam: 'Please log in to take the exam',
      startFailed: 'Failed to start the exam',
      submitting: 'Submitting your paper...',
      examSubmitted: 'Exam submitted',
      examCompleted: 'Exam completed!',
      submit: 'Submit',
      submitConfirmTitle: 'Submit this exam?',
      submitConfirmGoBack: 'Go back',
      questionNavigation: 'Question navigation',
      legendAnswered: 'Answered',
      legendUnanswered: 'Unanswered',
      legendCurrent: 'Current question',
      legendFlagged: 'Review later',
      questionLabel: (idx: number, total: number) => `Question ${idx} / ${total}`,
      marksLabel: 'Marks',
      negativeLabel: 'Negative',
      flag: 'Flag',
      unflag: 'Unflag',
      cqLabel: 'Write your answer:',
      cqPlaceholder: 'Write your answer here...',
      prevQuestion: 'Previous question',
      nextQuestion: 'Next question',
      totalQuestions: 'Total questions',
      answered: 'Answered',
      unanswered: 'Unanswered',
      flagged: 'Flagged',
      lastSaved: 'Last saved',
      sectionTab: 'Section',
      backToExamList: 'Back to exam list',
      scoreLabel: 'Your score',
      solutionsLabel: 'Solution Sheet',
      explanationLabel: 'Explanation',
    };
  }
  return {
    loading: 'Loading exam...',
    loginToTakeExam: 'Please log in to take the exam',
    startFailed: 'Failed to start the exam',
    submitting: 'Submitting your paper...',
    examSubmitted: 'Exam submitted',
    examCompleted: 'Exam completed!',
    submit: 'Submit',
    submitConfirmTitle: 'Submit this exam?',
    submitConfirmGoBack: 'Go back',
    questionNavigation: 'Question navigation',
    legendAnswered: 'Answered',
    legendUnanswered: 'Unanswered',
    legendCurrent: 'Current question',
    legendFlagged: 'Review later',
    questionLabel: (idx: number, total: number) => `Question ${idx} / ${total}`,
    marksLabel: 'Marks',
    negativeLabel: 'Negative',
    flag: 'Flag',
    unflag: 'Unflag',
    cqLabel: 'Write your answer:',
    cqPlaceholder: 'Write your answer here...',
    prevQuestion: 'Previous question',
    nextQuestion: 'Next question',
    totalQuestions: 'Total questions',
    answered: 'Answered',
    unanswered: 'Unanswered',
    flagged: 'Flagged',
    lastSaved: 'Last saved',
    sectionTab: 'Section',
    backToExamList: 'Back to exam list',
    scoreLabel: 'Your score',
    solutionsLabel: 'Solution Sheet',
    explanationLabel: 'Explanation',
  };
};
