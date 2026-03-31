'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { distributeProportionalByFee } from '@/lib/admission-distribution';
import {
  validateAdmissionPayment,
  netPayableAfterAdjustments,
  type AdmissionPaymentChannel,
} from '@/lib/admission-payment-zod';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { getCourses, type Course } from '@/lib/api/courses';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getPrograms, getProgramById, type Program } from '@/lib/api/programs';
import {
  offlineAdmission,
  getEnrollments,
  type PaymentMethodType,
} from '@/lib/api/enrollments';
import {
  AlertTriangle,
  Check,
  BookOpen,
  CheckCircle2,
  ListTree,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CalendarIcon,
  Lock,
  Search,
} from 'lucide-react';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

function parseDateInput(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateInput(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface AddEnrollmentFormProps {
  studentId: string;
  defaultBranchId?: string;
  onSuccess: () => Promise<void>;
}

const STEP_LABELS = ['Courses', 'Payment', 'Confirm'] as const;

export function AddEnrollmentForm({ studentId, defaultBranchId, onSuccess }: AddEnrollmentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [enrollmentMode, setEnrollmentMode] = useState<'program' | 'monthly'>('program');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [programCourses, setProgramCourses] = useState<Course[]>([]);
  const [programId, setProgramId] = useState('');
  const [programSelectedIds, setProgramSelectedIds] = useState<string[]>([]);
  const [monthlySelectedIds, setMonthlySelectedIds] = useState<string[]>([]);
  const [monthlySearch, setMonthlySearch] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** courseIds with an enrollment row at the selected branch (any status — DB unique prevents duplicate). */
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [branchId, setBranchId] = useState(defaultBranchId || '');
  const defaultMonth = () => new Date().toISOString().slice(0, 7);
  const [billingStartMonth, setBillingStartMonth] = useState(defaultMonth());

  const [totalDiscountAmount, setTotalDiscountAmount] = useState('');
  const [totalScholarshipAmount, setTotalScholarshipAmount] = useState('');
  const [totalPaymentAmount, setTotalPaymentAmount] = useState('');
  const [discountReference, setDiscountReference] = useState('');
  const [admissionChannel, setAdmissionChannel] = useState<AdmissionPaymentChannel>('offline');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [progRes, branchRes, courseRes] = await Promise.all([
          getPrograms(),
          getBranches(),
          getCourses({ status: 'ACTIVE', limit: 400 }),
        ]);
        if (progRes.success && progRes.data) setPrograms(progRes.data);
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        if (courseRes.success && courseRes.data) setAllCourses(courseRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!studentId || !branchId) {
      setEnrolledCourseIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingEnrollments(true);
        const res = await getEnrollments({
          studentUserId: studentId,
          branchId,
          limit: 500,
        });
        if (cancelled) return;
        const ids =
          res.success && res.data
            ? [...new Set(res.data.map((e) => e.courseId))]
            : [];
        setEnrolledCourseIds(ids);
      } catch {
        if (!cancelled) setEnrolledCourseIds([]);
      } finally {
        if (!cancelled) setLoadingEnrollments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, branchId]);

  useEffect(() => {
    setProgramSelectedIds((prev) => prev.filter((id) => !enrolledCourseIds.includes(id)));
    setMonthlySelectedIds((prev) => prev.filter((id) => !enrolledCourseIds.includes(id)));
  }, [enrolledCourseIds]);

  useEffect(() => {
    const loadProgramCourses = async () => {
      if (!programId) {
        setProgramCourses([]);
        setProgramSelectedIds([]);
        return;
      }
      try {
        setLoadingCourses(true);
        const res = await getProgramById(programId);
        if (res.success && res.data?.courses) {
          const list = res.data.courses as Course[];
          setProgramCourses(list);
          const blocked = new Set(enrolledCourseIds);
          setProgramSelectedIds(list.map((c) => c.id).filter((id) => !blocked.has(id)));
        } else {
          setProgramCourses([]);
          setProgramSelectedIds([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadProgramCourses();
  }, [programId, enrolledCourseIds]);

  const resolveSelectedIds = (): string[] => {
    if (enrollmentMode === 'monthly') return monthlySelectedIds;
    return programSelectedIds;
  };

  const monthlyCoursesAll = useMemo(
    () => allCourses.filter((c) => c.billingType === 'MONTHLY'),
    [allCourses],
  );

  const monthlyCoursesFiltered = useMemo(() => {
    const q = monthlySearch.trim().toLowerCase();
    if (!q) return monthlyCoursesAll;
    return monthlyCoursesAll.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)),
    );
  }, [monthlyCoursesAll, monthlySearch]);

  const enrolledSet = useMemo(() => new Set(enrolledCourseIds), [enrolledCourseIds]);

  const programSelectableIds = useMemo(
    () => programCourses.map((c) => c.id).filter((id) => !enrolledSet.has(id)),
    [programCourses, enrolledSet],
  );

  const monthlyVisibleSelectableIds = useMemo(
    () => monthlyCoursesFiltered.map((c) => c.id).filter((id) => !enrolledSet.has(id)),
    [monthlyCoursesFiltered, enrolledSet],
  );

  const courseMap = useMemo(() => {
    const m = new Map<string, Course>();
    programCourses.forEach((c) => m.set(c.id, c));
    allCourses.forEach((c) => m.set(c.id, c));
    return m;
  }, [programCourses, allCourses]);

  const toggleProgramCourse = (courseId: string) => {
    if (enrolledSet.has(courseId)) return;
    setProgramSelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const toggleAllProgram = () => {
    const selectableIds = programSelectableIds;
    if (selectableIds.length === 0) return;
    const allPicked = selectableIds.every((id) => programSelectedIds.includes(id));
    if (allPicked) {
      setProgramSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setProgramSelectedIds((prev) => [...new Set([...prev.filter((id) => !selectableIds.includes(id)), ...selectableIds])]);
    }
  };

  const toggleMonthlyCourse = (courseId: string) => {
    if (enrolledSet.has(courseId)) return;
    setMonthlySelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const toggleAllMonthlyVisible = () => {
    const visibleIds = monthlyVisibleSelectableIds;
    const allPicked = visibleIds.length > 0 && visibleIds.every((id) => monthlySelectedIds.includes(id));
    if (allPicked) {
      setMonthlySelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setMonthlySelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const ids = useMemo(() => {
    if (enrollmentMode === 'monthly') return monthlySelectedIds;
    return programSelectedIds;
  }, [enrollmentMode, monthlySelectedIds, programSelectedIds]);

  const totalCourseFee = useMemo(
    () => ids.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0),
    [ids, courseMap],
  );

  const totalDiscountNum = Number(totalDiscountAmount) || 0;
  const totalScholarshipNum = Number(totalScholarshipAmount) || 0;
  const totalPaymentNum = Number(totalPaymentAmount) || 0;

  const netPayable = useMemo(
    () => netPayableAfterAdjustments(totalCourseFee, totalDiscountNum, totalScholarshipNum),
    [totalCourseFee, totalDiscountNum, totalScholarshipNum],
  );

  const balanceAfterPay = useMemo(
    () => Math.max(0, Math.round((netPayable - totalPaymentNum) * 100) / 100),
    [netPayable, totalPaymentNum],
  );

  const adjustmentsOverTotalFees =
    totalCourseFee > 0 && totalDiscountNum + totalScholarshipNum > totalCourseFee + 1e-6;

  const maxDiscountAllowed = Math.max(0, Math.round((totalCourseFee - totalScholarshipNum) * 100) / 100);
  const maxScholarshipAllowed = Math.max(0, Math.round((totalCourseFee - totalDiscountNum) * 100) / 100);

  const paymentFieldsLocked =
    admissionChannel === 'online' || (admissionChannel === 'offline' && adjustmentsOverTotalFees);

  useEffect(() => {
    if (admissionChannel !== 'offline') return;
    setTotalPaymentAmount((prev) => {
      const pay = Number(prev) || 0;
      if (pay > netPayable + 0.0001) return String(netPayable);
      return prev;
    });
  }, [admissionChannel, netPayable]);

  useEffect(() => {
    if (admissionChannel === 'online') {
      setTotalPaymentAmount('0');
      setPaymentMethod('GATEWAY');
      setPaymentTrxId('');
    }
  }, [admissionChannel]);

  const distributedPreview = useMemo(() => {
    const feeFn = (id: string) => Number(courseMap.get(id)?.fee) || 0;
    const discMap = distributeProportionalByFee(ids, feeFn, totalDiscountNum);
    const scholMap = distributeProportionalByFee(ids, feeFn, totalScholarshipNum);
    const payMap = distributeProportionalByFee(ids, feeFn, totalPaymentNum);
    const rows = ids.map((id) => {
      const fee = feeFn(id);
      const d = discMap[id] ?? 0;
      const sc = scholMap[id] ?? 0;
      const p = payMap[id] ?? 0;
      const payable = Math.max(fee - d - sc, 0);
      const due = Math.max(payable - p, 0);
      return { id, fee, disc: d, schol: sc, pay: p, payable, due };
    });
    return { rows };
  }, [ids, courseMap, totalDiscountNum, totalScholarshipNum, totalPaymentNum]);

  const validateStep1 = (): boolean => {
    const sel = resolveSelectedIds();
    if (sel.length === 0 || !branchId) {
      setError(
        enrollmentMode === 'monthly'
          ? 'Select at least one monthly course and a branch'
          : 'Select program courses and a branch',
      );
      return false;
    }
    if (sel.some((id) => enrolledSet.has(id))) {
      setError(
        'Some selected courses are already enrolled at this branch. Deselect them or pick another branch.',
      );
      return false;
    }
    const needsMonth = sel.some((id) => courseMap.get(id)?.billingType === 'MONTHLY');
    if (needsMonth && !/^\d{4}-\d{2}$/.test(billingStartMonth.trim())) {
      setError('Billing month (YYYY-MM) is required for monthly courses.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    const sel = resolveSelectedIds();
    const tFee = sel.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0);
    const v = validateAdmissionPayment(tFee, admissionChannel, {
      totalDiscountAmount,
      totalScholarshipAmount,
      totalPaymentAmount,
      discountReference,
      paymentMethod,
      paymentTrxId,
    });
    if (v.ok === false) {
      setError(v.message);
      return false;
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      if (!billingStartMonth.trim()) {
        const sel = resolveSelectedIds();
        const needsMonth = sel.some((id) => courseMap.get(id)?.billingType === 'MONTHLY');
        if (needsMonth) setBillingStartMonth(defaultMonth());
      }
      const sel = resolveSelectedIds();
      let sumOffer = 0;
      let refFrom = '';
      for (const id of sel) {
        const c = courseMap.get(id);
        const offer =
          c?.offerDiscountAmount != null && String(c.offerDiscountAmount) !== ''
            ? Number(c.offerDiscountAmount)
            : 0;
        sumOffer += offer;
        if (offer > 0 && !refFrom) refFrom = (c?.offerDiscountNote || '').trim();
      }
      const tFee = sel.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0);
      setTotalDiscountAmount(sumOffer > 0 ? String(Math.round(sumOffer * 100) / 100) : '');
      setDiscountReference(refFrom);
      setTotalScholarshipAmount('');
      setTotalPaymentAmount(String(Math.round(Math.max(tFee - sumOffer, 0) * 100) / 100));
    }
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    const sel = resolveSelectedIds();
    if (sel.some((id) => enrolledSet.has(id))) {
      setError('Selection includes courses already enrolled at this branch. Go back to step 1 and adjust.');
      return;
    }
    const monthYm = billingStartMonth.trim();
    const nextDueIso = nextPaymentDueDate
      ? new Date(`${nextPaymentDueDate}T12:00:00`).toISOString()
      : undefined;
    const feeFn = (id: string) => Number(courseMap.get(id)?.fee) || 0;
    const discTotal = Number(totalDiscountAmount) || 0;
    const scholTotal = Number(totalScholarshipAmount) || 0;
    const payTotal = Number(totalPaymentAmount) || 0;
    const discMap = distributeProportionalByFee(sel, feeFn, discTotal);
    const scholMap = distributeProportionalByFee(sel, feeFn, scholTotal);
    const payMap = distributeProportionalByFee(sel, feeFn, payTotal);
    const refShared = discountReference.trim();

    try {
      setSubmitting(true);
      setError(null);
      let pdfOpened = 0;
      for (const courseId of sel) {
        const c = courseMap.get(courseId);
        const disc = discMap[courseId] ?? 0;
        const schol = scholMap[courseId] ?? 0;
        const paid = payMap[courseId] ?? 0;
        const adm = await offlineAdmission({
          studentUserId: studentId,
          courseId,
          branchId,
          billingStartMonth: c?.billingType === 'MONTHLY' ? monthYm || undefined : undefined,
          paymentMethod,
          paymentAmount: paid,
          paymentTrxId: paid > 0 && paymentMethod !== 'CASH' ? paymentTrxId.trim() || undefined : undefined,
          discountAmount: disc > 0 ? disc : undefined,
          discountReference: disc > 0 ? refShared || undefined : undefined,
          scholarshipAmount: schol > 0 ? schol : undefined,
          nextPaymentDueDate: nextDueIso,
        });
        if (!adm.success) throw new Error(adm.message || 'Admission failed');
        const pdfUrl = adm.data?.pdfUrl;
        if (pdfUrl) {
          const delay = pdfOpened * 200;
          pdfOpened += 1;
          window.setTimeout(() => {
            window.open(pdfUrl, '_blank', 'noopener,noreferrer');
          }, delay);
        }
      }
      toast({
        title: 'Done',
        description: `${sel.length} course(s) enrolled. ${pdfOpened > 0 ? 'Invoice PDFs opened in new tab(s).' : 'Invoice PDFs were generated.'}`,
        variant: 'success',
      });
      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full max-h-[min(90vh,820px)] flex-col bg-white text-slate-900">
      <div className="border-b border-slate-100 px-4 pt-5 pb-4 sm:px-6">
        <div className="grid w-full grid-cols-3 gap-2 sm:gap-4">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex flex-col items-center px-0.5 text-center">
                <div
                  className={cn(
                    'mb-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-10 sm:w-10',
                    done
                      ? 'bg-indigo-600 text-white'
                      : active
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                        : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-semibold leading-snug sm:text-xs',
                    active ? 'text-indigo-700' : 'text-slate-500',
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
        {step === 1 && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <ListTree className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">How to pick courses</h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    Program: choose a program and tick multiple courses. Monthly: search and select any monthly-billing courses.
                    After you pick a <strong>branch</strong>, courses this student already has at that branch show as{' '}
                    <strong>Already enrolled</strong> and cannot be selected. Each row&apos;s Online / Offline badge is delivery
                    mode, not payment timing.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={enrollmentMode === 'program' ? 'default' : 'outline'}
                  className={cn(
                    'h-9 rounded-xl text-[10px] font-black uppercase',
                    enrollmentMode === 'program' && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white',
                  )}
                  onClick={() => {
                    setEnrollmentMode('program');
                    setError(null);
                  }}
                >
                  By program
                </Button>
                <Button
                  type="button"
                  variant={enrollmentMode === 'monthly' ? 'default' : 'outline'}
                  className={cn(
                    'h-9 rounded-xl text-[10px] font-black uppercase',
                    enrollmentMode === 'monthly' && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white',
                  )}
                  onClick={() => {
                    setEnrollmentMode('monthly');
                    setMonthlySelectedIds([]);
                    setMonthlySearch('');
                    setError(null);
                  }}
                >
                  Monthly courses
                </Button>
              </div>
            </section>

            {enrollmentMode === 'monthly' && (
              <div className="space-y-3">
                <label className={sectionLabel}>Search monthly courses</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    placeholder="Name or code…"
                    value={monthlySearch}
                    onChange={(e) => setMonthlySearch(e.target.value)}
                  />
                </div>
                <div className="flex justify-between gap-2 text-[10px] font-bold text-slate-500">
                  <span>
                    {monthlyCoursesFiltered.length} shown · {monthlySelectedIds.length} selected
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[10px] font-black uppercase"
                    onClick={toggleAllMonthlyVisible}
                    disabled={
                      monthlyCoursesFiltered.length === 0 || monthlyVisibleSelectableIds.length === 0
                    }
                  >
                    {monthlyVisibleSelectableIds.length > 0 &&
                    monthlyVisibleSelectableIds.every((id) => monthlySelectedIds.includes(id))
                      ? 'Deselect listed'
                      : 'Select all listed'}
                  </Button>
                </div>
                <div className="max-h-[min(40vh,320px)] space-y-2 overflow-y-auto pr-1">
                  {monthlyCoursesFiltered.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm font-bold text-slate-400">
                      No monthly courses match your search
                    </p>
                  ) : (
                    monthlyCoursesFiltered.map((course) => {
                      const isSelected = monthlySelectedIds.includes(course.id);
                      const alreadyEnrolled = enrolledSet.has(course.id);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          disabled={alreadyEnrolled}
                          onClick={() => toggleMonthlyCourse(course.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all',
                            alreadyEnrolled && 'cursor-not-allowed opacity-75',
                            isSelected && !alreadyEnrolled
                              ? 'border-indigo-200 bg-indigo-50/50'
                              : !alreadyEnrolled && 'border-slate-100 hover:border-slate-200',
                            alreadyEnrolled && 'border-amber-100 bg-amber-50/40',
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              disabled={alreadyEnrolled}
                              className="pointer-events-none shrink-0"
                            />
                            <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-black text-slate-800">{course.name}</p>
                                {alreadyEnrolled ? (
                                  <Badge variant="secondary" className="text-[9px] font-black uppercase">
                                    Already enrolled
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <CourseDeliveryBadge type={course.type} />
                                <p className="text-[10px] font-bold text-slate-400">
                                  {course.code} · ৳{Number(course.fee || 0).toFixed(0)} · Monthly
                                </p>
                              </div>
                            </div>
                          </div>
                          {isSelected && !alreadyEnrolled ? (
                            <Check className="h-5 w-5 shrink-0 text-indigo-600" />
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {enrollmentMode === 'program' && (
              <>
                <div className="space-y-2">
                  <label className={sectionLabel}>Program</label>
                  {programs.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-sm font-semibold text-amber-900">
                      No programs available.
                    </p>
                  ) : (
                    <Select value={programId || undefined} onValueChange={setProgramId}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                        <SelectValue placeholder="Choose a program…" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {!programId ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    Select a program to list its courses.
                  </div>
                ) : loadingCourses ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : programCourses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
                    This program has no courses yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-[10px] font-black uppercase"
                        onClick={toggleAllProgram}
                        disabled={programCourses.length === 0 || programSelectableIds.length === 0}
                      >
                        {programSelectableIds.length > 0 &&
                        programSelectableIds.every((id) => programSelectedIds.includes(id))
                          ? 'Deselect all'
                          : 'Select all'}
                      </Button>
                    </div>
                    {programCourses.map((course) => {
                      const isSelected = programSelectedIds.includes(course.id);
                      const alreadyEnrolled = enrolledSet.has(course.id);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          disabled={alreadyEnrolled}
                          onClick={() => toggleProgramCourse(course.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all',
                            alreadyEnrolled && 'cursor-not-allowed opacity-75',
                            isSelected && !alreadyEnrolled
                              ? 'border-indigo-200 bg-indigo-50/50'
                              : !alreadyEnrolled && 'border-slate-100 hover:border-slate-200',
                            alreadyEnrolled && 'border-amber-100 bg-amber-50/40',
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              disabled={alreadyEnrolled}
                              className="pointer-events-none shrink-0"
                            />
                            <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-slate-800">{course.name}</p>
                                {alreadyEnrolled ? (
                                  <Badge variant="secondary" className="text-[9px] font-black uppercase">
                                    Already enrolled
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <CourseDeliveryBadge type={course.type} />
                                <p className="text-[10px] font-bold text-slate-400">
                                  {course.code} · {course.billingType}
                                </p>
                              </div>
                            </div>
                          </div>
                          {isSelected && !alreadyEnrolled ? (
                            <Check className="h-5 w-5 shrink-0 text-indigo-600" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-6">
              <div className="space-y-2">
                <label className={sectionLabel}>Branch</label>
                <Select value={branchId || undefined} onValueChange={setBranchId}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {branchId ? (
                  loadingEnrollments ? (
                    <p className="text-[10px] font-bold text-slate-400">Loading enrollments for this branch…</p>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-500">
                      {enrolledCourseIds.length > 0
                        ? `${enrolledCourseIds.length} course(s) already linked at this branch — those rows are disabled above.`
                        : 'No existing course enrollments at this branch for this student.'}
                    </p>
                  )
                ) : (
                  <p className="text-[10px] font-bold text-slate-400">Choose a branch to detect duplicate enrollments.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Billing month (monthly courses)</label>
                <MonthYearPicker value={billingStartMonth} onChange={setBillingStartMonth} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Payment & adjustments</h3>
                <p className="text-xs text-slate-500">
                  Totals below apply to <strong>all selected courses</strong>. Discount, scholarship, and pay-today are split
                  by each course fee. Discount + scholarship cannot exceed total fees; pay today cannot exceed net payable.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Payment timing (not course delivery type)</label>
              <p className="text-[11px] font-medium text-slate-500">
                Whether you record money <strong>now</strong> or the student pays <strong>later</strong>. Separate from each
                course&apos;s Online / Offline delivery badge in step 1.
              </p>
              <Select
                value={admissionChannel}
                onValueChange={(v) => setAdmissionChannel(v as 'offline' | 'online')}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="offline">Collect payment now (cash / bKash / bank)</SelectItem>
                  <SelectItem value="online">Pay later — invoice only for now (gateway later)</SelectItem>
                </SelectContent>
              </Select>
              {admissionChannel === 'online' ? (
                <p className="text-xs font-medium text-slate-600">
                  No payment recorded now. Invoice PDF is still created; the student can pay via the online gateway later.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Totals (auto)</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Total course fees</dt>
                  <dd className="font-mono">{totalCourseFee.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Net after discount & scholarship</dt>
                  <dd className="font-mono text-indigo-800">{netPayable.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Pay today (total)</dt>
                  <dd className="font-mono">{totalPaymentNum.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-amber-900">
                  <dt>Balance after pay today</dt>
                  <dd className="font-mono">{balanceAfterPay.toFixed(2)} BDT</dd>
                </div>
              </dl>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[320px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Course</th>
                    <th className="px-3 py-2 text-right">Fee (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ids.map((cid) => {
                    const c = courseMap.get(cid);
                    const fee = c?.fee != null ? Number(c.fee) : 0;
                    return (
                      <tr key={cid}>
                        <td className="px-3 py-2 font-bold text-slate-800">{c?.name}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">{fee.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
                  <tr>
                    <td className="px-3 py-2 text-xs font-black uppercase text-slate-600">Total</td>
                    <td className="px-3 py-2 text-right font-black text-slate-900">{totalCourseFee.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adjustments (discount & scholarship)</p>
              <p className="mt-1 text-xs text-slate-500">
                Combined discount + scholarship cannot exceed total course fees ({totalCourseFee.toFixed(2)} BDT). Max discount
                alone: {maxDiscountAllowed.toFixed(2)} · Max scholarship alone: {maxScholarshipAllowed.toFixed(2)}.
              </p>
              {adjustmentsOverTotalFees ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Discount + scholarship exceed total fees. Lower one or both — payment fields stay locked until this is
                    fixed.
                  </span>
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Total discount (BDT)</label>
                  <Input
                    className={cn(
                      inputClass,
                      adjustmentsOverTotalFees && 'border-rose-300 bg-rose-50/50 focus-visible:ring-rose-200',
                    )}
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalDiscountAmount}
                    onChange={(e) => setTotalDiscountAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Total scholarship (BDT)</label>
                  <Input
                    className={cn(
                      inputClass,
                      adjustmentsOverTotalFees && 'border-rose-300 bg-rose-50/50 focus-visible:ring-rose-200',
                    )}
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalScholarshipAmount}
                    onChange={(e) => setTotalScholarshipAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Discount reference (required if discount &gt; 0)</label>
                  <Input
                    className={inputClass}
                    value={discountReference}
                    onChange={(e) => setDiscountReference(e.target.value)}
                    placeholder="Offer code, approver, reason…"
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                'rounded-2xl border p-4 shadow-sm transition-colors',
                paymentFieldsLocked ? 'border-slate-200 bg-slate-50/80' : 'border-emerald-200 bg-emerald-50/30',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Payment collected today</p>
                {paymentFieldsLocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                    <Lock className="h-3 w-3" />
                    {admissionChannel === 'online' ? 'Pay later' : 'Fix adjustments'}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Only these fields are for today&apos;s collection. They are disabled when paying online or when adjustments
                exceed fees.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Total pay today (BDT)</label>
                  <Input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalPaymentAmount}
                    onChange={(e) => setTotalPaymentAmount(e.target.value)}
                    disabled={paymentFieldsLocked}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Payment method</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}
                    disabled={paymentFieldsLocked}
                  >
                    <SelectTrigger
                      className={cn(
                        'h-12 rounded-2xl border-slate-200 font-bold',
                        paymentFieldsLocked ? 'bg-slate-100 text-slate-500' : 'bg-white shadow-sm',
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BKASH">bKash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="GATEWAY">Gateway / online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Transaction / slip reference (non-cash, if paying now)</label>
                  <Input
                    className={inputClass}
                    value={paymentTrxId}
                    onChange={(e) => setPaymentTrxId(e.target.value)}
                    placeholder="Trx ID, bank ref…"
                    disabled={paymentFieldsLocked}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Next payment date (all invoices)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-12 w-full justify-start rounded-2xl border-slate-200 bg-slate-50/50 font-bold',
                        !nextPaymentDueDate && 'text-slate-400',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextPaymentDueDate
                        ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy')
                        : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                    <Calendar
                      selected={parseDateInput(nextPaymentDueDate)}
                      onSelect={(date) => setNextPaymentDueDate(formatDateInput(date))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
              <div className="border-b border-indigo-100 bg-indigo-600 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Per-course split (preview)</p>
                <p className="text-xs font-medium text-indigo-100">Amounts scaled by each course fee; same totals as above.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2 text-right">Fee</th>
                      <th className="px-3 py-2 text-right">Disc</th>
                      <th className="px-3 py-2 text-right">Schol.</th>
                      <th className="px-3 py-2 text-right">Pay</th>
                      <th className="px-3 py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {distributedPreview.rows.map((r) => (
                      <tr key={r.id} className="bg-white">
                        <td
                          className="max-w-[200px] truncate px-3 py-2.5 font-bold text-slate-800"
                          title={courseMap.get(r.id)?.name}
                        >
                          {courseMap.get(r.id)?.name}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{r.fee.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-amber-800">{r.disc.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-violet-800">{r.schol.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-800">{r.pay.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-black text-rose-700">{r.due.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-800">Review</h3>
              <p className="mt-2 text-xs font-bold text-slate-600">Confirm the table below, then enroll and create invoices.</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Course</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                    <th className="px-3 py-2 text-right">Disc.</th>
                    <th className="px-3 py-2 text-right">Schol.</th>
                    <th className="px-3 py-2 text-right">Pay now</th>
                    <th className="px-3 py-2 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {distributedPreview.rows.map((r) => {
                    const c = courseMap.get(r.id);
                    return (
                      <tr key={r.id} className="bg-white">
                        <td className="px-3 py-2 font-bold text-slate-800">{c?.name}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.fee.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.disc.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.schol.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.pay.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-black text-amber-800">{r.due.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs font-bold text-slate-600">
              <p>Branch: {branches.find((b) => b.id === branchId)?.name || '—'}</p>
              <p>Billing month: {billingStartMonth || '—'}</p>
              <p>
                Payment timing:{' '}
                {admissionChannel === 'offline' ? 'Collect now (cash / bKash / bank)' : 'Pay later (gateway)'}
              </p>
              <p>Payment method: {paymentMethod}</p>
              <p>Next payment: {nextPaymentDueDate ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy') : '—'}</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-700">{error}</div>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-slate-100 px-6 py-5">
        <Button variant="outline" className="h-12 flex-1 rounded-2xl font-bold text-sm" onClick={step === 1 ? closeModal : goBack}>
          {step === 1 ? (
            'Close'
          ) : (
            <>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </>
          )}
        </Button>
        {step < 3 ? (
          <Button
            className="h-12 flex-[2] rounded-2xl bg-slate-900 font-bold text-sm text-white hover:bg-slate-800 hover:text-white disabled:opacity-50"
            onClick={goNext}
            disabled={step === 2 && adjustmentsOverTotalFees}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="h-12 flex-[2] rounded-2xl bg-indigo-600 font-bold text-sm text-white hover:bg-indigo-500 hover:text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '…' : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Enroll & create invoices
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
