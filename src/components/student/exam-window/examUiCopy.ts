export type Lang = 'bn' | 'en';

export const isBanglaText = (v?: string | null): boolean => {
  if (!v) return false;
  return /[\u0980-\u09FF]/.test(v);
};

export const detectQuestionLang = (
  question?: { prompt?: string; options?: { text?: string }[] } | null,
  fallback: Lang = 'bn',
): Lang => {
  const prompt = question?.prompt || '';
  const optionText = (question?.options || []).map((o) => o?.text || '').join(' ');
  const combined = `${prompt} ${optionText}`;
  return isBanglaText(combined) ? 'bn' : 'en';
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
    };
  }
  return {
    submit: 'জমা দিন',
    submitConfirmTitle: 'পরীক্ষা জমা দিবেন?',
    submitConfirmGoBack: 'ফিরে যান',
    questionNavigation: 'প্রশ্ন নেভিগেশন',
    legendAnswered: 'উত্তর দেওয়া হয়েছে',
    legendUnanswered: 'উত্তর দেওয়া হয়নি',
    legendCurrent: 'বর্তমান প্রশ্ন',
    legendFlagged: 'পরে দেখব',
    questionLabel: (idx: number, total: number) => `প্রশ্ন ${idx} / ${total}`,
    marksLabel: 'মার্কস',
    negativeLabel: 'নেগেটিভ',
    flag: 'পতাকা দিন',
    unflag: 'পতাকা সরান',
    cqLabel: 'আপনার উত্তর লিখুন:',
    cqPlaceholder: 'এখানে আপনার উত্তর লিখুন...',
    prevQuestion: 'আগের প্রশ্ন',
    nextQuestion: 'পরের প্রশ্ন',
    totalQuestions: 'মোট প্রশ্ন',
    answered: 'উত্তর দেওয়া',
    unanswered: 'উত্তর দেওয়া হয়নি',
    flagged: 'পতাকা দেওয়া',
    lastSaved: 'সর্বশেষ সংরক্ষণ',
    sectionTab: 'অংশ',
  };
};
