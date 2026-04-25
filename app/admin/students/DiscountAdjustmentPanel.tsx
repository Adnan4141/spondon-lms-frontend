'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Course, CourseWithDiscount } from './types';
import { distributeDiscount, fmt, fmtMonth } from './utils';
import { StudentAdminBadge as AppBadge } from './StudentAdminBadge';
import { StudentAdminField as Field } from './StudentAdminField';

interface DiscountAdjustmentPanelProps {
  courses: Course[];
  currentDiscount: number;
  triggerType: 'ADD' | 'REMOVE';
  changedCourse: Course;
  effectiveMonth: string;
  onApply: (discount: number, distribution: CourseWithDiscount[]) => void;
  onBack: () => void;
}

export function DiscountAdjustmentPanel({
  courses, currentDiscount, triggerType, changedCourse, effectiveMonth, onApply, onBack,
}: DiscountAdjustmentPanelProps) {
  const [mode, setMode] = useState<'keep' | 'adjust'>('keep');
  const [newDiscount, setNewDiscount] = useState(String(currentDiscount));

  const isRemove = triggerType === 'REMOVE';
  const totalFee = courses.reduce((s, c) => s + c.fee, 0);
  const appliedDiscount = mode === 'keep' ? currentDiscount : (Number(newDiscount) || 0);
  const distributed = distributeDiscount(courses, Math.min(appliedDiscount, totalFee));
  const netMonthly = totalFee - appliedDiscount;
  const discountExceedsTotal = appliedDiscount > totalFee;

  return (
    <div>
      {/* Alert banner */}
      <div className={cn(
        'rounded-xl border px-4 py-3 mb-5 flex gap-3 items-start',
        isRemove ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200',
      )}>
        {isRemove
          ? <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          : <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        }
        <div>
          <p className={cn('font-bold text-sm', isRemove ? 'text-orange-800' : 'text-emerald-800')}>
            {isRemove
              ? `You removed ${changedCourse.name} (${fmt(changedCourse.fee)}/month)`
              : `You added ${changedCourse.name} (${fmt(changedCourse.fee)}/month)`
            }
          </p>
          <p className={cn('text-xs mt-0.5', isRemove ? 'text-orange-600' : 'text-emerald-600')}>
            Your monthly discount distribution will change. Please review and confirm below.
          </p>
        </div>
      </div>

      {/* Remaining courses */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        {isRemove ? 'Remaining courses after cancellation' : 'Courses after addition'}
      </p>
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
        {courses.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              'flex justify-between items-center px-3.5 py-2.5',
              i < courses.length - 1 && 'border-b border-slate-100',
              !isRemove && c.id === changedCourse.id ? 'bg-emerald-50' : 'bg-white',
            )}
          >
            <div className="flex items-center gap-2">
              {!isRemove && c.id === changedCourse.id && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">NEW</span>
              )}
              <span className="font-semibold text-sm text-slate-900">{c.name}</span>
              <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
            </div>
            <span className="font-bold text-rose-600 text-sm">{fmt(c.fee)}/mo</span>
          </div>
        ))}
        <div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border-t-2 border-slate-200">
          <span className="font-bold text-slate-900 text-sm">Total Fee</span>
          <span className="font-black text-slate-900 text-sm">{fmt(totalFee)}/mo</span>
        </div>
      </div>

      {/* Mode selector */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Adjustment</p>
      <div className="flex flex-col gap-2 mb-4">
        {[
          { id: 'keep' as const, label: 'Keep same discount amount', desc: `৳${Number(currentDiscount).toLocaleString()} redistributed proportionally across new courses` },
          { id: 'adjust' as const, label: 'Adjust discount', desc: 'Enter a new monthly discount amount' },
        ].map(opt => (
          <label
            key={opt.id}
            className={cn(
              'flex gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors',
              mode === opt.id
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <input
              type="radio"
              checked={mode === opt.id}
              onChange={() => setMode(opt.id)}
              className="accent-indigo-600 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-bold text-sm text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {mode === 'adjust' && (
        <Field label="New Monthly Discount" hint={`Maximum: ${fmt(totalFee)}`} error={discountExceedsTotal ? 'Discount cannot exceed total fee' : ''}>
          <Input
            type="number"
            value={newDiscount}
            onChange={e => setNewDiscount(e.target.value)}
            min={0}
            max={totalFee}
            className="focus-visible:ring-indigo-400"
          />
        </Field>
      )}

      {/* Live preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distribution Preview</p>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-bold">
            Effective from: {fmtMonth(effectiveMonth)}
          </span>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              {['Course', 'Fee', 'Discount', 'Net Fee'].map(h => (
                <th
                  key={h}
                  className={cn(
                    'py-2 px-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide',
                    h === 'Course' ? 'text-left' : 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {distributed.map(c => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="py-2 px-2.5 font-semibold text-slate-900">{c.name}</td>
                <td className="py-2 px-2.5 text-right text-slate-600">{fmt(c.fee)}</td>
                <td className="py-2 px-2.5 text-right text-rose-500 font-semibold">
                  {c.discount > 0 ? `−${fmt(c.discount)}` : '—'}
                </td>
                <td className="py-2 px-2.5 text-right font-bold text-slate-900">{fmt(c.fee - c.discount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-rose-200 bg-rose-50">
              <td className="py-2.5 px-2.5 font-black text-slate-900">Total Monthly</td>
              <td className="py-2.5 px-2.5 text-right font-bold">{fmt(totalFee)}</td>
              <td className="py-2.5 px-2.5 text-right font-bold text-rose-500">
                {appliedDiscount > 0 ? `−${fmt(Math.min(appliedDiscount, totalFee))}` : '—'}
              </td>
              <td className="py-2.5 px-2.5 text-right font-black text-rose-700 text-base">
                {fmt(Math.max(0, netMonthly))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
        <Button
          onClick={() => !discountExceedsTotal && onApply(appliedDiscount, distributed)}
          disabled={discountExceedsTotal}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
        >
          <Check className="h-4 w-4" /> Apply & Generate Updated Invoices
        </Button>
      </div>
    </div>
  );
}
