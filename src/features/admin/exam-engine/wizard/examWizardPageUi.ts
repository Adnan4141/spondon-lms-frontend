import { cn } from '@/lib/utils';

/** Shared shell classes for /admin/exam/new and setup wizard pages. */
export const examWizardPageClass = 'min-h-[calc(100vh-5rem)] bg-[#F4F6FB]';
export const examWizardHeaderClass = cn(
  'sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur',
);
export const examWizardContainerClass = cn(
  'mx-auto w-full max-w-full min-w-0 px-3 py-4 sm:px-4 lg:px-5',
);
export const examWizardMainClass = cn(examWizardContainerClass, 'pb-8');
export const examWizardFooterClass = cn(
  'sticky bottom-0 z-10 -mx-3 mt-6 border-t border-slate-200 bg-[#F4F6FB]/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5',
);
export const wizardCardClass = 'overflow-hidden rounded-2xl border-slate-200 shadow-sm';
