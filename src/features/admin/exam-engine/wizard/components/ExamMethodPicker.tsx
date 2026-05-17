'use client';

import { ClipboardCheck, Layers, Library, PenLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ExamProductType } from '../../types';
import { EXAM_PRODUCT_TYPES } from '../constants';

type Props = {
  value: ExamProductType | '';
  invalid?: boolean;
  onChange: (productType: ExamProductType) => void;
};

/**
 * Picks one of the 4 spec exam types. Mode (Online/Offline), OMR sheet,
 * Result-entry methods, and SMS are all orthogonal selectors handled
 * elsewhere in the wizard.
 */
export function ExamMethodPicker({ value, invalid, onChange }: Props) {
  const iconMap = {
    MCQ: ClipboardCheck,
    WRITTEN: PenLine,
    COMBINED: Layers,
    MULTI: Library,
  } as const;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Exam type</CardTitle>
        <CardDescription>
          Pick what students will answer. Mode, OMR, result-entry, and SMS are configured in the steps that follow.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {EXAM_PRODUCT_TYPES.map((productType) => {
          const Icon = iconMap[productType.id];
          const active = value === productType.id;
          return (
            <button
              key={productType.id}
              type="button"
              onClick={() => onChange(productType.id)}
              className={cn(
                'min-h-36 rounded-lg border bg-white p-4 text-left transition-all hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                active && 'border-[#0D1B35] bg-[#0D1B35]/[0.04] shadow-[0_0_0_3px_rgba(13,27,53,0.06)]',
                invalid && !value && 'ring-2 ring-rose-200',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700',
                    active && 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {productType.bestFor}
                </span>
              </div>
              <div className="mt-3 font-semibold text-slate-900">{productType.name}</div>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{productType.desc}</p>
            </button>
          );
        })}
      </CardContent>
      {invalid ? <p className="px-6 pb-2 text-xs text-rose-600">Select an exam type.</p> : null}
    </Card>
  );
}
