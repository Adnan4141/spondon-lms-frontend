'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

export function ExamSyllabusCard({ state, dispatch }: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-base text-[#0D1B35]">Syllabus & instructions</CardTitle>
        <CardDescription>
          Optional. Shown to students before they start the exam (topics, rules, materials allowed).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RichTextEditor
          value={state.syllabusHtml}
          onChange={(html) => dispatch({ type: 'MERGE', patch: { syllabusHtml: html } })}
          placeholder="e.g. Chapter 5–7 from textbook, no calculator, 60 minutes…"
          className="min-h-[140px]"
        />
      </CardContent>
    </Card>
  );
}
