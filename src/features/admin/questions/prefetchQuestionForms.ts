import type { ActiveTab } from './questions-page-utils';
import { loadMathSupport } from '@/components/ui/rich-text-editor';

const prefetched = new Set<string>();

function prefetchOnce(key: string, loader: () => Promise<unknown>) {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  void loader();
}

export function prefetchRichTextEditor() {
  prefetchOnce('rich-text-editor', () => import('@/components/ui/rich-text-editor'));
  prefetchOnce('rich-text-editor-math', () => loadMathSupport());
}

export function prefetchQuestionFormForTab(tab: ActiveTab) {
  prefetchRichTextEditor();

  switch (tab) {
    case 'MCQ_SIMPLE':
      prefetchOnce('QuestionForm', () => import('./forms/QuestionForm'));
      break;
    case 'MCQ_PASSAGE':
      prefetchOnce('PassageForm', () => import('./forms/PassageForm'));
      break;
    case 'CQ':
      prefetchOnce('CqForm', () => import('./forms/CqForm'));
      break;
    case 'SHORT':
      prefetchOnce('ShortQuestionForm', () => import('./forms/ShortQuestionForm'));
      break;
  }
}
