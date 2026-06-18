'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fmt } from '../utils';
import { effectiveCourseFee, moneyNumber } from './enrollment-modal-utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import { StudentAdminSelect as AppSelect } from '../components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '../components/StudentMonthInput';
import type { Course } from '../types';
import type { EnrollmentModalController } from './hooks/useEnrollmentModal';

export function EnrollmentModalStep1({ ctrl }: { ctrl: EnrollmentModalController }) {
  const {
    validation,
    programId,
    setProgramId,
    programs,
    enrolledProgramIds,
    branchId,
    setBranchId,
    branches,
    loadingEnrolled,
    availableCourses,
    alreadyEnrolledCourses,
    coursesWithBatches,
    coursesNoBatch,
    selCourses,
    courseBatches,
    loadingBatches,
    isMonthlyProgram,
    toggle,
    setCF,
    billingStart,
    setBillingStart,
    selected,
    grossCourseTotal,
    promotionalDiscount,
    totalFee,
    monthlyDiscount,
    setMonthlyDiscount,
    netMonthly,
    oneTimeDiscount,
    setOneTimeDiscount,
    oneTimeCoursePayable,
    program,
    admDiscount,
    setAdmDiscount,
    admFee,
    canNext,
    setStep,
  } = ctrl;

  return (
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Field label="Program" required>
                <AppSelect
                  value={programId}
                  onChange={setProgramId}
                  placeholder="Select program"
                  options={programs.map(p => ({
                    value: p.id,
                    label: enrolledProgramIds.has(p.id) ? `${p.name} (Already Enrolled)` : p.name,
                    disabled: enrolledProgramIds.has(p.id),
                  }))}
                />
                {validation.errors.programId && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.programId}</p>}
              </Field>
              <Field label="Service branch" hint="Fees and invoices attach to this branch. Cash you collect is recorded under your branch.">
                <AppSelect
                  value={branchId}
                  onChange={setBranchId}
                  placeholder="Select branch"
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                />
                {validation.errors.branchId && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.branchId}</p>}
              </Field>
            </div>

            {programId && branchId && (
              <div>
                {loadingEnrolled ? (
                  <p className="text-sm text-slate-400 text-center py-6">Checking enrollment status…</p>
                ) : (
                  <>
                    {/* Available (not yet enrolled) courses */}
                    {availableCourses.length > 0 && (() => {
                      const renderCourseCard = (c: Course, noBatch = false) => {
                        const sel = selCourses[c.id];
                        const activeBatches = (courseBatches[c.id] ?? []).filter(b => b.status === 'ACTIVE');
                        return (
                          <div
                            key={c.id}
                            className={cn(
                              'border rounded-xl p-3.5 transition-all',
                              sel?.checked
                                ? 'border-rose-300 bg-rose-50'
                                : noBatch
                                  ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                                  : 'border-slate-200 bg-white hover:border-slate-300',
                            )}
                          >
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!sel?.checked}
                                onChange={() => toggle(c.id)}
                                className="mt-0.5 accent-rose-600"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-bold text-sm text-slate-900">{c.name}</span>
                                  <span className="text-right text-sm">
                                    {effectiveCourseFee(c) < moneyNumber(c.fee) && (
                                      <span className="mr-1 font-semibold text-slate-400 line-through">
                                        {fmt(c.fee)}
                                      </span>
                                    )}
                                    <span className="font-black text-rose-700">
                                      {fmt(effectiveCourseFee(c))}{isMonthlyProgram ? '/month' : ''}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                                  <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                                  {c.type === 'OFFLINE' && !loadingBatches && (
                                    activeBatches.length > 0
                                      ? <AppBadge label={`${activeBatches.length} Batch${activeBatches.length > 1 ? 'es' : ''}`} color="green" />
                                      : <AppBadge label="No Active Batch" color="red" />
                                  )}
                                  <span className="text-xs text-slate-400">
                                    Payment mode: {isMonthlyProgram ? 'monthly' : 'one-time'}
                                  </span>
                                </div>
                              </div>
                            </label>
                            {sel?.checked && (
                              <div className={cn(
                                'grid gap-2.5 mt-3 pt-3 border-t border-dashed',
                                noBatch ? 'border-amber-200' : 'border-rose-200',
                                c.type === 'OFFLINE' && isMonthlyProgram ? 'grid-cols-3' : 'grid-cols-1',
                              )}>
                                {c.type === 'OFFLINE' && (
                                  <Field label="Batch" required>
                                    <AppSelect
                                      value={sel.batch || ''}
                                      onChange={v => setCF(c.id, 'batch', v)}
                                      placeholder="Select batch"
                                      options={activeBatches.map(b => ({
                                        value: b.id,
                                        label: b.name,
                                      }))}
                                    />
                                    {(validation.errors[`batch.${c.id}`] || !sel.batch) && (
                                      <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                        {validation.errors[`batch.${c.id}`] || 'Required'}
                                      </p>
                                    )}
                                  </Field>
                                )}
                                {isMonthlyProgram && (
                                  <>
                                    <Field label="Start Month" required>
                                      <MonthInput
                                        value={sel.startMonth || billingStart}
                                        onChange={v => setCF(c.id, 'startMonth', v)}
                                        min={c.startMonth}
                                        max={sel.endMonth || c.endMonth}
                                      />
                                      {validation.errors[`startMonth.${c.id}`] && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                          {validation.errors[`startMonth.${c.id}`]}
                                        </p>
                                      )}
                                    </Field>
                                    <Field label="End Month" required>
                                      <MonthInput
                                        value={sel.endMonth || c.endMonth || sel.startMonth || billingStart}
                                        onChange={v => setCF(c.id, 'endMonth', v)}
                                        min={sel.startMonth || c.startMonth || billingStart}
                                        max={c.endMonth}
                                      />
                                      {validation.errors[`endMonth.${c.id}`] && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                          {validation.errors[`endMonth.${c.id}`]}
                                        </p>
                                      )}
                                    </Field>
                                  </>
                                )}
                              </div>
                            )}
                            {noBatch && !sel?.checked && (
                              <div className="mt-2 flex items-center gap-1.5 text-amber-600">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs font-semibold">No active batch available for this course</span>
                              </div>
                            )}
                          </div>
                        );
                      };
                      return (
                        <>
                          {coursesWithBatches.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Available Courses</p>
                              <div className="flex flex-col gap-2">
                                {coursesWithBatches.map(c => renderCourseCard(c))}
                              </div>
                            </div>
                          )}
                          {coursesNoBatch.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" /> Courses Without Active Batch
                              </p>
                              <div className="flex flex-col gap-2">
                                {coursesNoBatch.map(c => renderCourseCard(c, true))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Already-enrolled courses — shown at bottom, disabled */}
                    {alreadyEnrolledCourses.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Already Enrolled
                        </p>
                        <div className="flex flex-col gap-2 mb-2">
                          {alreadyEnrolledCourses.map(c => (
                            <div
                              key={c.id}
                              className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 opacity-60"
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  disabled
                                  className="mt-0.5 accent-rose-600 cursor-not-allowed"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm text-slate-500">{c.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-slate-400 text-sm">
                                        {fmt(effectiveCourseFee(c))}{isMonthlyProgram ? '/month' : ''}
                                      </span>
                                      <AppBadge label="Already Enrolled" color="slate" />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                                    <span className="text-xs text-slate-400">
                                      Payment mode: {isMonthlyProgram ? 'monthly' : 'one-time'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All enrolled or no courses */}
                    {availableCourses.length === 0 && alreadyEnrolledCourses.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2 items-start mt-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 font-semibold">
                          All courses in this program are already enrolled.
                        </p>
                      </div>
                    )}
                    {availableCourses.length === 0 && alreadyEnrolledCourses.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-5">No courses found in this program.</p>
                    )}
                  </>
                )}
              </div>
            )}
            {programId && !branchId && (
              <div className="border border-dashed border-slate-200 rounded-xl px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Select branch to load course list</p>
                <p className="text-xs text-slate-400 mt-1">Courses will appear after both program and branch are selected.</p>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5">Admission Summary</p>
              {selected.length > 0 ? (
                <>
                  <ul className="list-decimal pl-4 mb-3.5 space-y-1">
                    {selected.map(c => (
                      <li key={c.id} className="text-sm text-slate-900 font-semibold">{c.name}</li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-200 pt-3 space-y-1.5">
                    {[['Course fee', fmt(grossCourseTotal)], ['Promotional discount', promotionalDiscount > 0 ? `−${fmt(promotionalDiscount)}` : '৳0']].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-sm text-slate-500">{k}</span>
                        <span className={cn('text-sm font-semibold text-slate-900', k === 'Promotional discount' && promotionalDiscount > 0 && 'text-emerald-700')}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-slate-200 mb-1">
                      <span className="text-sm font-bold text-slate-900">Sub-total</span>
                      <span className="text-sm font-black text-slate-900">{fmt(totalFee)}</span>
                    </div>
                  </div>

                  {isMonthlyProgram && (
                    <>
                      <Field label="Monthly Scholarship">
                        <Input
                          type="number"
                          min={0}
                          max={totalFee}
                          value={monthlyDiscount}
                          onChange={e => setMonthlyDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                        {validation.errors.monthlyDiscount && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.monthlyDiscount}</p>
                        )}
                      </Field>
                      <Field label="Billing Start Month">
                        <MonthInput value={billingStart} onChange={setBillingStart} />
                      </Field>
                      <div className="bg-white border-2 border-rose-200 rounded-xl px-3.5 py-2.5 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">Total (monthly fee)</span>
                          <span className="font-black text-base text-rose-700">{fmt(netMonthly)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {!isMonthlyProgram && (
                    <>
                      <Field label="One-time Discount">
                        <Input
                          type="number"
                          min={0}
                          max={totalFee}
                          value={oneTimeDiscount}
                          onChange={e => setOneTimeDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                        {validation.errors.oneTimeDiscount && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.oneTimeDiscount}</p>
                        )}
                      </Field>
                      <div className="bg-white border-2 border-rose-200 rounded-xl px-3.5 py-2.5 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">Total (one-time fee)</span>
                          <span className="font-black text-base text-rose-700">{fmt(oneTimeCoursePayable)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {program?.admissionFeeEnabled && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-500">Admission fee</span>
                        <span className="font-bold text-sm">{fmt(program.admissionFeeAmount)}</span>
                      </div>
                      <Field label="Discount on admission fee">
                        <Input
                          type="number"
                          min={0}
                          max={program.admissionFeeAmount}
                          value={admDiscount}
                          onChange={e => setAdmDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                        {validation.errors.admDiscount && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.admDiscount}</p>
                        )}
                      </Field>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-slate-900">Admission fee payment</span>
                        <span className="font-black text-rose-700">{fmt(admFee)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-sm text-slate-400">Select courses to see summary</p>
                  {validation.errors.selectedCourseCount && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.selectedCourseCount}</p>
                  )}
                </div>
              )}
            </div>
            <Button
              className="w-full gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
              disabled={!canNext}
              onClick={() => setStep(2)}
            >
              Review & Confirm →
            </Button>
          </div>
        </div>
  );
}
