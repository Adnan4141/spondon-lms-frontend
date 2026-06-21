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
      resultPublishedTitle: 'Result published',
      evaluationPendingTitle: 'Submitted — evaluation in progress',
      evaluationPendingLabel: 'Teacher evaluation pending',
      evaluationPendingMessage: 'Written answers are still being evaluated. Final score and percentage will appear after marking is complete.',
      evaluationPendingNote: 'Written answers are marked by your teacher; score may appear later.',
      provisionalMcqScoreLabel: 'Provisional MCQ score',
      totalExamMarksLabel: 'Total exam marks',
      writtenPendingLabel: 'Written section pending',
      resultHiddenLabel: 'Result not published yet',
      resultHiddenTitle: 'Your exam has been submitted',
      resultHiddenMessage: 'Your submission was recorded. Results will be published when the exam authority releases them.',
      uploadedPagesLabel: 'Uploaded pages',
      combinedPdfLabel: 'Combined PDF',
      pageLabel: (n: number) => `Page ${n}`,
      yourWrittenAnswer: 'Your written answer',
      yourShortAnswer: 'Your short answer',
      writtenMarksLabel: 'Marks',
      timelineSubmitted: 'Submitted',
      timelineMarking: 'Marking',
      timelineResult: 'Final result',
      refreshResult: 'Refresh result',
      stimulusLabel: 'Stimulus',
      autoSubmittedLabel: 'Auto submitted',
      leaderboardLabel: 'Leaderboard',
      mcqTabLabel: 'MCQ',
      writtenTabLabel: 'Written',
      partMarksLabel: (part: string, marks: number | string) => `Part ${part}: ${marks}`,
      partPendingLabel: 'Pending',
      passageLabel: 'Passage',
      jumpToQuestionLabel: 'Jump to question',
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
    resultPublishedTitle: 'ফলাফল প্রকাশিত',
    evaluationPendingTitle: 'জমা হয়েছে — মূল্যায়ন চলছে',
    evaluationPendingLabel: 'শিক্ষকের মূল্যায়ন বাকি',
    evaluationPendingMessage: 'লিখিত উত্তর এখনো মূল্যায়ন করা হচ্ছে। চূড়ান্ত নম্বর ও শতকরা হার মূল্যায়ন শেষ হলে দেখাবে।',
    evaluationPendingNote: 'লিখিত উত্তর শিক্ষক মূল্যায়ন করবেন; নম্বর পরে দেখাবে।',
    provisionalMcqScoreLabel: 'অস্থায়ী MCQ নম্বর',
    totalExamMarksLabel: 'মোট পরীক্ষার নম্বর',
    writtenPendingLabel: 'লিখিত অংশ বাকি',
    resultHiddenLabel: 'ফলাফল এখনো প্রকাশ হয়নি',
    resultHiddenTitle: 'আপনার পরীক্ষা জমা হয়েছে',
    resultHiddenMessage: 'আপনার জমা রেকর্ড করা হয়েছে। পরীক্ষা কর্তৃপক্ষ ফলাফল প্রকাশ করলে দেখতে পাবেন।',
    uploadedPagesLabel: 'আপলোড করা পাতা',
    combinedPdfLabel: 'সম্মিলিত PDF',
    pageLabel: (n: number) => `পাতা ${n}`,
    yourWrittenAnswer: 'আপনার লিখিত উত্তর',
    yourShortAnswer: 'আপনার সংক্ষিপ্ত উত্তর',
    writtenMarksLabel: 'নম্বর',
    timelineSubmitted: 'জমা হয়েছে',
    timelineMarking: 'মূল্যায়ন',
    timelineResult: 'চূড়ান্ত ফলাফল',
    refreshResult: 'ফলাফল রিফ্রেশ',
    stimulusLabel: 'উদ্দীপক',
    autoSubmittedLabel: 'অটো জমা',
    leaderboardLabel: 'লিডারবোর্ড',
    mcqTabLabel: 'MCQ',
    writtenTabLabel: 'লিখিত',
    partMarksLabel: (part: string, marks: number | string) => `(${part}) নম্বর: ${marks}`,
    partPendingLabel: 'বাকি',
    passageLabel: 'উদ্দীপক',
    jumpToQuestionLabel: 'প্রশ্নে যান',
  };
};
