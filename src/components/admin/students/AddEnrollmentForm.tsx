'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { distributeProportionalByFee } from '@/lib/admission-distribution';
import {
  validateAdmissionPayment,
  netPayableAfterAdjustments,
} from '@/lib/admission-payment-zod';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { getCourses, type Course } from '@/lib/api/courses';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getPrograms, getProgramById, type Program } from '@/lib/api/programs';
import { getBatches, type Batch } from '@/lib/api/batches';
import {
  offlineAdmission,
  getEnrollments,
  updateEnrollment,
  type Enrollment,
  type PaymentMethodType,
} from '@/lib/api/enrollments';
import { getEnrollmentDiscountHistory, type EnrollmentDiscountLogEntry } from '@/lib/api/enrollments';
import {
  AlertTriangle,
  Check,
  BookOpen,
  CheckCircle2,
  ListTree,
  ChevronLeft,
  ChevronRight,
  Search,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
} from 'lucide-react';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

interface AddEnrollmentFormProps {
  studentId: string;
  defaultBranchId?: string;
  onSuccess: () => Promise<void>;
  /**
   * When embedded in EditStudentWizard, parent owns steps 2–4 (Register is step 1 on parent).
   * Parent `parentStep`: 2 = courses, 3 = payment, 4 = confirm.
   */
  nestedInParentWizard?: {
    parentStep: number;
    setParentStep: (step: number) => void;
    onBackToProfile: () => void;
  };
}

const STEP_LABELS = ['Courses', 'Payment', 'Confirm'] as const;

export function AddEnrollmentForm({
  studentId,
  defaultBranchId,
  onSuccess,
  nestedInParentWizard,
}: AddEnrollmentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [internalStep, setInternalStep] = useState(1);
  const nested = nestedInParentWizard;
  const step = nested ? nested.parentStep - 1 : internalStep;
  const [enrollmentMode, setEnrollmentMode] = useState<'program' | 'search'>('program');
  const [selectedBillingType, setSelectedBillingType] = useState<'ONE_TIME' | 'MONTHLY'>('ONE_TIME');
  const [installmentCount, setInstallmentCount] = useState<number>(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [programCourses, setProgramCourses] = useState<Course[]>([]);
  const [programId, setProgramId] = useState('');
  const [programSelectedIds, setProgramSelectedIds] = useState<string[]>([]);
  const [searchSelectedIds, setSearchSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** courseIds with an enrollment row at the selected branch (any status — DB unique prevents duplicate). */
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  /** Map courseId → Enrollment for richer display (status, createdAt) */
  const [enrollmentByCourse, setEnrollmentByCourse] = useState<Map<string, Enrollment>>(new Map());
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [discountHistory, setDiscountHistory] = useState<EnrollmentDiscountLogEntry[]>([]);
  const [discountHistoryOpen, setDiscountHistoryOpen] = useState(false);

  const [branchId, setBranchId] = useState(defaultBranchId || '');
  const defaultMonth = () => new Date().toISOString().slice(0, 7);
  const [billingStartMonth, setBillingStartMonth] = useState(defaultMonth());

  useEffect(() => {
    if (defaultBranchId) setBranchId(defaultBranchId);
  }, [defaultBranchId]);

  const [totalDiscountAmount, setTotalDiscountAmount] = useState('');
  const [totalPaymentAmount, setTotalPaymentAmount] = useState('');
  const [batchAssignments, setBatchAssignments] = useState<Record<string, string>>({});
  const [availableBatches, setAvailableBatches] = useState<Record<string, Batch[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [discountReference, setDiscountReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');
  const [monthlyFlatDiscount, setMonthlyFlatDiscount] = useState('');
  const [includeBooks, setIncludeBooks] = useState(true);

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
        // Build courseId → enrollment map (last wins, prefer ACTIVE over others)
        if (res.success && res.data) {
          const map = new Map<string, Enrollment>();
          for (const e of res.data) {
            const existing = map.get(e.courseId);
            if (!existing || e.status === 'ACTIVE' || existing.status === 'CANCELLED') {
              map.set(e.courseId, e);
            }
          }
          setEnrollmentByCourse(map);
        }
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

  // Fetch discount history for this student
  useEffect(() => {
    if (!studentId) return;
    getEnrollmentDiscountHistory(studentId).then((res) => {
      if (res.success && res.data) setDiscountHistory(res.data);
    }).catch(() => {});
  }, [studentId]);

  useEffect(() => {
    setProgramSelectedIds((prev) => prev.filter((id) => !enrolledCourseIds.includes(id)));
    setSearchSelectedIds((prev) => prev.filter((id) => !enrolledCourseIds.includes(id)));
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
          setProgramSelectedIds([]);
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
    if (enrollmentMode === 'search') return searchSelectedIds;
    return programSelectedIds;
  };

  const searchCoursesFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)),
    );
  }, [allCourses, searchQuery]);

  const enrolledSet = useMemo(() => new Set(enrolledCourseIds), [enrolledCourseIds]);

  const programSelectableIds = useMemo(
    () => programCourses.map((c) => c.id).filter((id) => !enrolledSet.has(id)),
    [programCourses, enrolledSet],
  );

  const searchVisibleSelectableIds = useMemo(
    () => searchCoursesFiltered.map((c) => c.id).filter((id) => !enrolledSet.has(id)),
    [searchCoursesFiltered, enrolledSet],
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

  const toggleSearchCourse = (courseId: string) => {
    if (enrolledSet.has(courseId)) return;
    setSearchSelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const toggleAllSearchVisible = () => {
    const visibleIds = searchVisibleSelectableIds;
    const allPicked = visibleIds.length > 0 && visibleIds.every((id) => searchSelectedIds.includes(id));
    if (allPicked) {
      setSearchSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSearchSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleResume = async (courseId: string) => {
    const enrollment = enrollmentByCourse.get(courseId);
    if (!enrollment || enrollment.status !== 'PAUSED') return;
    try {
      const res = await updateEnrollment(enrollment.id, { status: 'ACTIVE', reason: 'Resumed by admin' });
      if (res.success) {
        toast({ title: 'Enrollment resumed', description: `${enrollment.course?.name ?? courseId} is now ACTIVE.` });
        // Re-fetch enrollments
        const updated = await getEnrollments({ studentUserId: studentId, branchId, limit: 500 });
        if (updated.success && updated.data) {
          const ids2 = [...new Set(updated.data.map((e) => e.courseId))];
          setEnrolledCourseIds(ids2);
          const map = new Map<string, Enrollment>();
          for (const e of updated.data) {
            const ex = map.get(e.courseId);
            if (!ex || e.status === 'ACTIVE' || ex.status === 'CANCELLED') map.set(e.courseId, e);
          }
          setEnrollmentByCourse(map);
        }
      } else {
        toast({ title: 'Error', description: res.message || 'Could not resume enrollment', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to resume enrollment', variant: 'destructive' });
    }
  };

  const ids = useMemo(() => {
    if (enrollmentMode === 'search') return searchSelectedIds;
    return programSelectedIds;
  }, [enrollmentMode, searchSelectedIds, programSelectedIds]);

  const totalCourseFee = useMemo(
    () => ids.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0),
    [ids, courseMap],
  );

  /**
   * Admission fee programs: derived from the `programs` list (which carries the full program fields).
   * For program-mode we use the selected programId directly.
   * For search-mode we try to match courses' program.id against the programs list.
   */
  const admissionFeePrograms = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; amount: number }[] = [];

    if (enrollmentMode === 'program') {
      const prog = programs.find((p) => p.id === programId);
      if (prog?.admissionFeeEnabled && prog.admissionFeeAmount && Number(prog.admissionFeeAmount) > 0 && ids.length > 0) {
        out.push({ id: prog.id, name: prog.name, amount: Number(prog.admissionFeeAmount) });
      }
    } else {
      // search mode — derive from courses' program reference
      for (const id of ids) {
        const c = courseMap.get(id);
        const progId = (c?.program as { id?: string } | undefined)?.id;
        if (!progId || seen.has(progId)) continue;
        const prog = programs.find((p) => p.id === progId);
        if (prog?.admissionFeeEnabled && prog.admissionFeeAmount && Number(prog.admissionFeeAmount) > 0) {
          seen.add(progId);
          out.push({ id: prog.id, name: prog.name, amount: Number(prog.admissionFeeAmount) });
        }
      }
    }
    return out;
  }, [enrollmentMode, programId, ids, courseMap, programs]);

  /** Admin-editable admission fee overrides (programId → amount string). */
  const [admissionFeeOverrides, setAdmissionFeeOverrides] = useState<Record<string, string>>({});

  // Re-seed overrides when the program set changes
  useEffect(() => {
    if (!admissionFeePrograms.length) return;
    setAdmissionFeeOverrides((prev) => {
      const next: Record<string, string> = {};
      for (const p of admissionFeePrograms) {
        next[p.id] = prev[p.id] ?? String(p.amount);
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, enrollmentMode]);

  const effectiveAdmissionFeeTotal = useMemo(
    () => admissionFeePrograms.reduce((s, p) => s + (Number(admissionFeeOverrides[p.id]) || 0), 0),
    [admissionFeePrograms, admissionFeeOverrides],
  );

  const grossBeforeDiscount = useMemo(
    () => totalCourseFee + effectiveAdmissionFeeTotal,
    [totalCourseFee, effectiveAdmissionFeeTotal],
  );

  /** Legacy alias kept for info-banners in course-selection step */
  const totalAdmissionFee = effectiveAdmissionFeeTotal;

  const totalDiscountNum = Number(totalDiscountAmount) || 0;
  const totalPaymentNum = Number(totalPaymentAmount) || 0;

  const netPayable = useMemo(
    () => netPayableAfterAdjustments(grossBeforeDiscount, totalDiscountNum),
    [grossBeforeDiscount, totalDiscountNum],
  );

  const balanceAfterPay = useMemo(
    () => Math.max(0, Math.round((netPayable - totalPaymentNum) * 100) / 100),
    [netPayable, totalPaymentNum],
  );

  const adjustmentsOverTotalFees =
    grossBeforeDiscount > 0 && totalDiscountNum > grossBeforeDiscount + 1e-6;

  const maxDiscountAllowed = Math.max(0, Math.round(grossBeforeDiscount * 100) / 100);

  const paymentFieldsLocked = adjustmentsOverTotalFees;

  useEffect(() => {
    setTotalPaymentAmount((prev) => {
      const pay = Number(prev) || 0;
      if (pay > netPayable + 0.0001) return String(netPayable);
      return prev;
    });
  }, [netPayable]);

  const distributedPreview = useMemo(() => {
    const feeFn = (id: string) => Number(courseMap.get(id)?.fee) || 0;
    const discMap = distributeProportionalByFee(ids, feeFn, totalDiscountNum);
    const payMap = distributeProportionalByFee(ids, feeFn, totalPaymentNum);
    const rows = ids.map((id) => {
      const fee = feeFn(id);
      const d = discMap[id] ?? 0;
      const p = payMap[id] ?? 0;
      const payable = Math.max(fee - d, 0);
      const due = Math.max(payable - p, 0);
      return { id, fee, disc: d, pay: p, payable, due };
    });
    const totalFee = ids.reduce((s, id) => s + feeFn(id), 0);
    return { rows, totalFee };
  }, [ids, courseMap, totalDiscountNum, totalPaymentNum]);

  const validateStep1 = (): boolean => {
    const sel = resolveSelectedIds();
    if (sel.length === 0 || !branchId) {
      setError(
        enrollmentMode === 'search'
          ? 'Select at least one course and a branch'
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
    const needsMonth = selectedBillingType === 'MONTHLY';
    if (needsMonth && !/^\d{4}-\d{2}$/.test(billingStartMonth.trim())) {
      setError('Billing month (YYYY-MM) is required for monthly billing.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    const sel = resolveSelectedIds();
    const tFee = sel.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0);
    const gross = tFee + effectiveAdmissionFeeTotal;
    const v = validateAdmissionPayment(gross, 'offline', {
      totalDiscountAmount,
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

  const goNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      if (!billingStartMonth.trim()) {
        const needsMonth = selectedBillingType === 'MONTHLY';
        if (needsMonth) setBillingStartMonth(defaultMonth());
      }
      const sel = resolveSelectedIds();
      // Load batches for OFFLINE courses
      const offlineCourseIds = sel.filter((id) => courseMap.get(id)?.type === 'OFFLINE');
      if (offlineCourseIds.length > 0) {
        setLoadingBatches(true);
        const newAvailable: Record<string, Batch[]> = { ...availableBatches };
        try {
          await Promise.all(
            offlineCourseIds.map(async (courseId) => {
              if (!newAvailable[courseId]) {
                const res = await getBatches({ courseId, branchId: branchId || undefined, status: 'ACTIVE', limit: 100 });
                newAvailable[courseId] = res.data ?? [];
              }
            })
          );
          setAvailableBatches(newAvailable);
          
          // Auto-unselect OFFLINE courses that have no available batches
          const coursesWithoutBatches = offlineCourseIds.filter((id) => {
            const batches = newAvailable[id] ?? [];
            return batches.length === 0;
          });
          
          if (coursesWithoutBatches.length > 0) {
            setProgramSelectedIds((prev) => prev.filter((id) => !coursesWithoutBatches.includes(id)));
            setSearchSelectedIds((prev) => prev.filter((id) => !coursesWithoutBatches.includes(id)));
            
            const courseNames = coursesWithoutBatches.map((id) => courseMap.get(id)?.name ?? id).join(', ');
            toast({
              title: 'Courses auto-unselected',
              description: `${coursesWithoutBatches.length} OFFLINE course(s) without available batches were unselected: ${courseNames}`,
              variant: 'default',
            });
          }
        } finally {
          setLoadingBatches(false);
        }
      }
      const tFee = sel.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0);
      // Default payment = course fees + admission fees
      const defaultPayment = tFee + effectiveAdmissionFeeTotal;
      setTotalPaymentAmount(String(Math.round(defaultPayment * 100) / 100));
    }
    if (step === 2) {
      // Validate batch selection for OFFLINE courses
      const sel = resolveSelectedIds();
      const offlineCourseIds = sel.filter((id) => courseMap.get(id)?.type === 'OFFLINE');
      const missingBatch = offlineCourseIds.filter((id) => !batchAssignments[id]);
      if (missingBatch.length > 0) {
        const names = missingBatch.map((id) => courseMap.get(id)?.name ?? id).join(', ');
        setError(`Batch selection is required for offline course(s): ${names}`);
        return;
      }
      if (!validateStep2()) return;
    }
    if (nested) nested.setParentStep(Math.min(4, nested.parentStep + 1));
    else setInternalStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError(null);
    if (nested) {
      if (nested.parentStep <= 2) nested.onBackToProfile();
      else nested.setParentStep(nested.parentStep - 1);
    } else {
      setInternalStep((s) => Math.max(1, s - 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    const sel = resolveSelectedIds();
    if (sel.some((id) => enrolledSet.has(id))) {
      setError('Selection includes courses already enrolled at this branch. Go back to step 1 and adjust.');
      return;
    }
    const monthYm = billingStartMonth.trim();
    // nextPaymentDueDate is now in YYYY-MM format from MonthYearPicker
    const nextDueIso = nextPaymentDueDate && /^\d{4}-\d{2}$/.test(nextPaymentDueDate.trim())
      ? new Date(`${nextPaymentDueDate.trim()}-01T12:00:00`).toISOString()
      : undefined;
    const discTotal = Number(totalDiscountAmount) || 0;
    const payTotal = Number(totalPaymentAmount) || 0;
    const refShared = discountReference.trim();
    const needsMonth = selectedBillingType === 'MONTHLY';

    try {
      setSubmitting(true);
      setError(null);
      const feeOverrides: Record<string, number> = {};
      for (const p of admissionFeePrograms) {
        const v = Number(admissionFeeOverrides[p.id]);
        if (!Number.isNaN(v) && v >= 0) feeOverrides[p.id] = v;
      }

      const adm = await offlineAdmission({
        studentUserId: studentId,
        branchId,
        courses: sel.map((courseId) => ({ courseId, batchId: batchAssignments[courseId] || undefined })),
        billingType: selectedBillingType,
        billingStartMonth: needsMonth ? monthYm || undefined : undefined,
        paymentMethod,
        paymentAmount: payTotal,
        paymentTrxId: payTotal > 0 && paymentMethod !== 'CASH' ? paymentTrxId.trim() || undefined : undefined,
        discountAmount: discTotal > 0 ? discTotal : undefined,
        discountReference: discTotal > 0 ? refShared || undefined : undefined,
        monthlyFlatDiscount: Number(monthlyFlatDiscount) || undefined,
        includeBooks,
        nextPaymentDueDate: nextDueIso,
        admissionFeeAmountOverrides: Object.keys(feeOverrides).length > 0 ? feeOverrides : undefined,
        installmentCount: selectedBillingType === 'ONE_TIME' && installmentCount > 0 ? installmentCount : undefined,
      });
      if (!adm.success) throw new Error(adm.message || 'Admission failed');
      const pdfUrl = adm.data?.pdfUrl;
      if (pdfUrl) {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      }
      toast({
        title: 'Done',
        description: `${sel.length} course(s) enrolled on one invoice.${pdfUrl ? ' PDF opened in a new tab.' : ''}`,
        variant: 'success',
      });
      if (!nested) closeModal();
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
      {!nested ? (
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
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
        {step === 1 && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <ListTree className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">How to pick courses</h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    Program: choose a program and tick multiple courses. Search: find and select any course.
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
                  variant={enrollmentMode === 'search' ? 'default' : 'outline'}
                  className={cn(
                    'h-9 rounded-xl text-[10px] font-black uppercase',
                    enrollmentMode === 'search' && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white',
                  )}
                  onClick={() => {
                    setEnrollmentMode('search');
                    setSearchSelectedIds([]);
                    setSearchQuery('');
                    setError(null);
                  }}
                >
                  Search all courses
                </Button>
              </div>
            </section>

            {/* ── Billing Type Selector ───────────────────────────── */}
            <div className="space-y-2">
              <label className={sectionLabel}>Billing type</label>
              <Select value={selectedBillingType} onValueChange={(v) => setSelectedBillingType(v as 'ONE_TIME' | 'MONTHLY')}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ONE_TIME">One-time payment</SelectItem>
                  <SelectItem value="MONTHLY">Monthly billing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Installment Selector (ONE_TIME only) ────────────── */}
            {selectedBillingType === 'ONE_TIME' && (
              <div className="space-y-2">
                <label className={sectionLabel}>Installments (optional)</label>
                <Select
                  value={String(installmentCount)}
                  onValueChange={(v) => setInstallmentCount(Number(v))}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="0">Full payment (no installments)</SelectItem>
                    <SelectItem value="2">2 installments</SelectItem>
                    <SelectItem value="3">3 installments</SelectItem>
                  </SelectContent>
                </Select>
                {installmentCount > 0 && (
                  <p className="text-xs font-medium text-amber-600 leading-relaxed">
                    Fee will be split into {installmentCount} equal invoices. Admission fee (if any) is added to the first installment.
                  </p>
                )}
              </div>
            )}

            {enrollmentMode === 'search' && (
              <div className="space-y-3">
                <label className={sectionLabel}>Search courses</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    placeholder="Name or code…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex justify-between gap-2 text-[10px] font-bold text-slate-500">
                  <span>
                    {searchCoursesFiltered.length} shown · {searchSelectedIds.length} selected
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[10px] font-black uppercase"
                    onClick={toggleAllSearchVisible}
                    disabled={
                      searchCoursesFiltered.length === 0 || searchVisibleSelectableIds.length === 0
                    }
                  >
                    {searchVisibleSelectableIds.length > 0 &&
                    searchVisibleSelectableIds.every((id) => searchSelectedIds.includes(id))
                      ? 'Deselect listed'
                      : 'Select all listed'}
                  </Button>
                </div>
                <div className="max-h-[min(40vh,320px)] space-y-2 overflow-y-auto pr-1">
                  {searchCoursesFiltered.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm font-bold text-slate-400">
                      No courses match your search
                    </p>
                  ) : (
                    searchCoursesFiltered.map((course) => {
                      const isSelected = searchSelectedIds.includes(course.id);
                      const alreadyEnrolled = enrolledSet.has(course.id);
                      const existingEnrollment = enrollmentByCourse.get(course.id);
                      const isPaused = existingEnrollment?.status === 'PAUSED';
                      return (
                        <div key={course.id} className="space-y-0">
                          <button
                            type="button"
                            disabled={alreadyEnrolled && !isPaused}
                            onClick={() => toggleSearchCourse(course.id)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all',
                              alreadyEnrolled && !isPaused && 'cursor-not-allowed opacity-75',
                              isSelected && !alreadyEnrolled
                                ? 'border-indigo-200 bg-indigo-50/50'
                                : !alreadyEnrolled && 'border-slate-100 hover:border-slate-200',
                              alreadyEnrolled && !isPaused && 'border-amber-100 bg-amber-50/40',
                              isPaused && 'border-amber-200 bg-amber-50/30',
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox
                                checked={isSelected}
                                disabled={alreadyEnrolled && !isPaused}
                                className="pointer-events-none shrink-0"
                              />
                              <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate font-black text-slate-800">{course.name}</p>
                                  {alreadyEnrolled && !isPaused ? (
                                    <span title={`ইতিমধ্যে ভর্তি আছেন (ACTIVE since ${existingEnrollment?.createdAt ? new Date(existingEnrollment.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'})`}>
                                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                                        ইতিমধ্যে ভর্তি
                                      </Badge>
                                    </span>
                                  ) : isPaused ? (
                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-amber-400 text-amber-700">
                                      PAUSED
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <CourseDeliveryBadge type={course.type} />
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {course.slug} · ৳{Number(course.fee || 0).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {isSelected && !alreadyEnrolled ? (
                              <Check className="h-5 w-5 shrink-0 text-indigo-600" />
                            ) : null}
                          </button>
                          {isPaused && (
                            <div className="rounded-b-2xl border border-t-0 border-amber-200 bg-amber-50/50 px-4 py-2 flex items-center justify-between gap-2">
                              <p className="text-[10px] font-bold text-amber-800">
                                Enrollment is PAUSED since {existingEnrollment?.updatedAt ? new Date(existingEnrollment.updatedAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}.
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-xl border-amber-400 text-amber-700 font-black text-[10px] uppercase hover:bg-amber-100"
                                onClick={(e) => { e.stopPropagation(); handleResume(course.id); }}
                              >
                                <PlayCircle className="mr-1 h-3 w-3" />
                                Resume করুন
                              </Button>
                            </div>
                          )}
                        </div>
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
                      const existingEnrollment = enrollmentByCourse.get(course.id);
                      const isPaused = existingEnrollment?.status === 'PAUSED';
                      return (
                        <div key={course.id} className="space-y-0">
                          <button
                            type="button"
                            disabled={alreadyEnrolled && !isPaused}
                            onClick={() => toggleProgramCourse(course.id)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all',
                              alreadyEnrolled && !isPaused && 'cursor-not-allowed opacity-75',
                              isSelected && !alreadyEnrolled
                                ? 'border-indigo-200 bg-indigo-50/50'
                                : !alreadyEnrolled && 'border-slate-100 hover:border-slate-200',
                              alreadyEnrolled && !isPaused && 'border-amber-100 bg-amber-50/40',
                              isPaused && 'border-amber-200 bg-amber-50/30',
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox
                                checked={isSelected}
                                disabled={alreadyEnrolled && !isPaused}
                                className="pointer-events-none shrink-0"
                              />
                              <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-black text-slate-800">{course.name}</p>
                                  {alreadyEnrolled && !isPaused ? (
                                    <span title={`ইতিমধ্যে ভর্তি আছেন (ACTIVE since ${existingEnrollment?.createdAt ? new Date(existingEnrollment.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'})`}>
                                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                                        ইতিমধ্যে ভর্তি
                                      </Badge>
                                    </span>
                                  ) : isPaused ? (
                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-amber-400 text-amber-700">
                                      PAUSED
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <CourseDeliveryBadge type={course.type} />
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {course.slug} · ৳{Number(course.fee || 0).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {isSelected && !alreadyEnrolled ? (
                              <Check className="h-5 w-5 shrink-0 text-indigo-600" />
                            ) : null}
                          </button>
                          {isPaused && (
                            <div className="rounded-b-2xl border border-t-0 border-amber-200 bg-amber-50/50 px-4 py-2 flex items-center justify-between gap-2">
                              <p className="text-[10px] font-bold text-amber-800">
                                Enrollment is PAUSED since {existingEnrollment?.updatedAt ? new Date(existingEnrollment.updatedAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}.
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-xl border-amber-400 text-amber-700 font-black text-[10px] uppercase hover:bg-amber-100"
                                onClick={(e) => { e.stopPropagation(); handleResume(course.id); }}
                              >
                                <PlayCircle className="mr-1 h-3 w-3" />
                                Resume করুন
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="border-t border-slate-100 pt-6">
              <div className="space-y-2">
                <label className={sectionLabel}>Billing month (for monthly billing)</label>
                <MonthYearPicker value={billingStartMonth} onChange={setBillingStartMonth} />
              </div>

              {admissionFeePrograms.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                    Admission fee will be added to invoice
                  </p>
                  {admissionFeePrograms.map((p) => (
                    <p key={p.id} className="text-xs font-bold text-amber-800">
                      {p.name} — ৳{p.amount.toLocaleString()} <span className="font-medium text-amber-600">(one-time per program)</span>
                    </p>
                  ))}
                  <p className="text-[10px] font-bold text-amber-600 mt-1">
                    Total admission fee: ৳{totalAdmissionFee.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Discount History Panel */}
              {discountHistory.length > 0 && (
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    onClick={() => setDiscountHistoryOpen((v) => !v)}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
                      ছাড়ের ইতিহাস ({discountHistory.length})
                    </span>
                    {discountHistoryOpen ? (
                      <ChevronUp className="h-4 w-4 text-indigo-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-indigo-500" />
                    )}
                  </button>
                  {discountHistoryOpen && (
                    <div className="overflow-x-auto border-t border-indigo-100">
                      <table className="w-full min-w-[400px] text-xs">
                        <thead className="bg-indigo-50 text-[10px] font-black uppercase text-indigo-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Course</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Applied by</th>
                            <th className="px-3 py-2 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                          {discountHistory.map((d) => (
                            <tr key={d.id} className="bg-white">
                              <td className="px-3 py-2 font-bold text-slate-700">{d.enrollment?.course?.name ?? '—'}</td>
                              <td className="px-3 py-2 text-right font-mono font-black text-indigo-800">৳{Number(d.discountAmount).toFixed(0)}</td>
                              <td className="px-3 py-2 font-bold text-slate-600">{d.discountType}</td>
                              <td className="px-3 py-2 text-slate-500">{d.appliedBy?.fullName ?? 'System'}</td>
                              <td className="px-3 py-2 text-slate-400">{new Date(d.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Wallet className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Payment & adjustments</h3>
                <p className="text-xs text-slate-500">
                  Totals below apply to <strong>all selected courses</strong>. Discount and pay-today are split
                  by each course fee. Discount cannot exceed total fees; pay today cannot exceed net payable.
                </p>
              </div>
            </div>

            {/* Batch assignments for OFFLINE courses */}
            {(() => {
              const sel = resolveSelectedIds();
              const offlineCourseIds = sel.filter((id) => courseMap.get(id)?.type === 'OFFLINE');
              if (offlineCourseIds.length === 0) return null;
              return (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                  <p className={sectionLabel}>Batch assignment (required for offline courses)</p>
                  {loadingBatches ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      Loading batches…
                    </div>
                  ) : (
                    offlineCourseIds.map((courseId) => {
                      const course = courseMap.get(courseId);
                      const batches = availableBatches[courseId] ?? [];
                      return (
                        <div key={courseId} className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                            {course?.name ?? courseId}
                          </label>
                          {batches.length === 0 ? (
                            <p className="text-xs text-rose-600 font-medium">No active batches available for this course at selected branch.</p>
                          ) : (
                            <Select
                              value={batchAssignments[courseId] ?? ''}
                              onValueChange={(v) => setBatchAssignments((prev) => ({ ...prev, [courseId]: v }))}
                            >
                              <SelectTrigger className="h-11 rounded-xl border-indigo-200 bg-white font-bold shadow-sm text-sm">
                                <SelectValue placeholder="Select a batch…" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {batches.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                    {b.capacity != null && b._count?.enrollments != null && (
                                      <span className="ml-1 text-slate-400">
                                        ({b._count.enrollments}/{b.capacity} seats)
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Totals (auto)</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Total course fees</dt>
                  <dd className="font-mono">{totalCourseFee.toFixed(2)} BDT</dd>
                </div>
                {effectiveAdmissionFeeTotal > 0 ? (
                  <div className="flex justify-between gap-2 font-bold text-amber-900">
                    <dt>Admission (on invoice)</dt>
                    <dd className="font-mono">{effectiveAdmissionFeeTotal.toFixed(2)} BDT</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Billable total</dt>
                  <dd className="font-mono">{grossBeforeDiscount.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Net after discount</dt>
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

            {/* ── Admission Fee (editable) ─────────────────────────────── */}
            {admissionFeePrograms.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/40">
                <div className="flex items-center gap-3 border-b border-indigo-100 bg-indigo-600 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Admission fee</p>
                    <p className="text-xs font-medium text-indigo-100">One-time per program · auto-added to invoice · edit if needed</p>
                  </div>
                </div>
                <div className="divide-y divide-indigo-100">
                  {admissionFeePrograms.map((p) => (
                    <div key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-indigo-900">{p.name}</p>
                        <p className="text-[10px] font-bold text-indigo-500">
                          Default: ৳{p.amount.toLocaleString()} · Edit below to override for this enrollment
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-indigo-700">৳</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={admissionFeeOverrides[p.id] ?? String(p.amount)}
                          onChange={(e) =>
                            setAdmissionFeeOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className="h-10 w-32 rounded-xl border border-indigo-200 bg-white px-3 text-right text-sm font-black text-indigo-900 shadow-inner outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-indigo-100 bg-white/60 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Total admission fee</span>
                  <span className="font-mono text-sm font-black text-indigo-900">৳{effectiveAdmissionFeeTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adjustments (discount)</p>
              <p className="mt-1 text-xs text-slate-500">
                Discount cannot exceed billable total ({grossBeforeDiscount.toFixed(2)} BDT). Max discount:{' '}
                {maxDiscountAllowed.toFixed(2)}.
              </p>
              {adjustmentsOverTotalFees ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Discount exceeds total fees. Lower it — payment fields stay locked until this is fixed.
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

            {/* Monthly discount & book inclusion */}
            {selectedBillingType === 'MONTHLY' && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Monthly Recurring Discount</p>
                <p className="mt-1 text-xs text-blue-500">
                  Flat discount distributed proportionally across all program courses every month.
                </p>
                <div className="mt-3">
                  <label className={sectionLabel}>Monthly flat discount (BDT)</label>
                  <Input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={monthlyFlatDiscount}
                    onChange={(e) => setMonthlyFlatDiscount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include-books"
                  checked={includeBooks}
                  onCheckedChange={(v) => setIncludeBooks(!!v)}
                />
                <label htmlFor="include-books" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Include course books in invoice
                </label>
              </div>
              <p className="mt-1 ml-7 text-xs text-slate-500">
                Auto-adds linked books (free books at ৳0, paid books at book price).
              </p>
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
                    Fix adjustments
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Only these fields are for today&apos;s collection. They are disabled when adjustments exceed fees.
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
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod !== 'CASH' && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className={sectionLabel}>Transaction / slip reference (required for non-cash)</label>
                    <Input
                      className={inputClass}
                      value={paymentTrxId}
                      onChange={(e) => setPaymentTrxId(e.target.value)}
                      placeholder="Trx ID, bank ref…"
                      disabled={paymentFieldsLocked}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Next payment month (all invoices)</label>
                <MonthYearPicker value={nextPaymentDueDate} onChange={setNextPaymentDueDate} />
              </div>
            </div>

            {admissionFeePrograms.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                  Admission fee · auto-added to invoice
                </p>
                {admissionFeePrograms.map((p) => (
                  <p key={p.id} className="text-xs font-bold text-amber-800">
                    {p.name} — ৳{p.amount.toLocaleString()} <span className="font-medium text-amber-600">(one-time per program)</span>
                  </p>
                ))}
                <p className="text-[10px] font-bold text-amber-600">
                  Invoice total will include ৳{totalAdmissionFee.toLocaleString()} admission fee on top of course fees.
                </p>
              </div>
            )}

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
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-800">{r.pay.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-black text-rose-700">{r.due.toFixed(0)}</td>
                      </tr>
                    ))}
                    {admissionFeePrograms.map((p) => {
                      const feeAmount = Number(admissionFeeOverrides[p.id]) || p.amount;
                      return (
                        <tr key={`admission-${p.id}`} className="bg-amber-50/30">
                          <td className="px-3 py-2.5 font-bold text-amber-900">
                            {p.name} <span className="text-[10px] font-medium text-amber-600">(Admission Fee)</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-amber-800">{feeAmount.toFixed(0)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-400">—</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-400">—</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-400">—</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Review & Confirm</h3>
                <p className="text-xs text-slate-500">Verify payment summary and enrollment details before submitting</p>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Payment Summary</p>
                <p className="text-xs font-medium text-indigo-100">Invoice breakdown for this enrollment</p>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Course Fees Section */}
                <div className="p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Course Fees</p>
                  {distributedPreview.rows.map((r) => {
                    const c = courseMap.get(r.id);
                    return (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{c?.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{c?.slug} · {selectedBillingType}</p>
                        </div>
                        <p className="ml-3 font-mono text-sm font-black text-slate-700">৳{r.fee.toLocaleString()}</p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-600">Subtotal (Courses)</p>
                    <p className="font-mono text-base font-black text-slate-900">৳{distributedPreview.totalFee.toLocaleString()}</p>
                  </div>
                </div>

                {/* Admission Fees Section */}
                {admissionFeePrograms.length > 0 && (
                  <div className="bg-amber-50/50 p-5 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Admission Fees (One-time)</p>
                    {admissionFeePrograms.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-amber-900">{p.name}</p>
                          <p className="text-[10px] font-medium text-amber-600">Program admission fee</p>
                        </div>
                        <p className="font-mono text-sm font-black text-amber-800">
                          ৳{(Number(admissionFeeOverrides[p.id]) || p.amount).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-amber-200 pt-3">
                      <p className="text-xs font-black uppercase tracking-wide text-amber-700">Subtotal (Admission)</p>
                      <p className="font-mono text-base font-black text-amber-900">৳{effectiveAdmissionFeeTotal.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Adjustments Section */}
                {totalDiscountNum > 0 && (
                  <div className="bg-violet-50/50 p-5 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-violet-700">Adjustments</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-violet-900">Discount</p>
                        {discountReference && (
                          <p className="text-[10px] font-medium text-violet-600">{discountReference}</p>
                        )}
                      </div>
                      <p className="font-mono text-sm font-black text-violet-700">-৳{totalDiscountNum.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Grand Total & Payment */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-wide text-slate-700">Total Payable</p>
                    <p className="font-mono text-xl font-black text-slate-900">৳{netPayable.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Payment Collected Today</p>
                    <p className="font-mono text-2xl font-black text-emerald-600">৳{totalPaymentNum.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <p className="text-sm font-black uppercase tracking-wide text-rose-700">Amount Due</p>
                    <p className="font-mono text-2xl font-black text-rose-600">৳{balanceAfterPay.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enrollment Details</p>
                <div className="space-y-1 text-xs font-bold text-slate-700">
                  <p>Branch: {branches.find((b) => b.id === branchId)?.name || '—'}</p>
                  <p>Courses: {resolveSelectedIds().length}</p>
                  <p>Billing starts: {billingStartMonth || 'N/A'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Info</p>
                <div className="space-y-1 text-xs font-bold text-slate-700">
                  <p>Method: {paymentMethod}</p>
                  {paymentTrxId && <p>Trx ID: {paymentTrxId}</p>}
                  {nextPaymentDueDate && <p>Next payment month: {nextPaymentDueDate}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-700">{error}</div>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-slate-100 px-6 py-5">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-2xl font-bold text-sm"
          onClick={step === 1 ? (nested ? nested.onBackToProfile : closeModal) : goBack}
        >
          {step === 1 ? (
            nested ? 'Back' : 'Close'
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
