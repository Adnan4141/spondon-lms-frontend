'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { createStudent, checkDuplicateMobile, sendCredentialsSms, sendCredentialsEmail } from '@/lib/api/students';
import { getPrograms, getProgramById, type Program } from '@/lib/api/programs';
import type { Course } from '@/lib/api/courses';
import { offlineAdmission, type PaymentMethodType } from '@/lib/api/enrollments';
import { getBatches, type Batch } from '@/lib/api/batches';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Branch, Institute, SmsAlertTo, UserStatus } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { InstituteCombobox } from '@/components/admin/students/StudentForm';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { distributeProportionalByFee } from '@/lib/admission-distribution';
import {
  validateAdmissionPayment,
  netPayableAfterAdjustments,
} from '@/lib/admission-payment-zod';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import {
  AlertTriangle,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  GraduationCap,
  Layers,
  Library,
  Mail,
  MessageSquare,
  Phone,
  User,
} from 'lucide-react';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-xs font-bold text-slate-500 mb-2 block';

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

type ProfileDraft = {
  fullName: string;
  email: string;
  mobile: string;
  branchId: string;
  status: UserStatus;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  dob: string;
  bloodGroup: string;
  gender: string;
  address: string;
  instituteId: string;
  smsAlertTo: SmsAlertTo[];
};

const emptyProfile: ProfileDraft = {
  fullName: '',
  email: '',
  mobile: '',
  branchId: '',
  status: 'ACTIVE',
  fatherName: '',
  motherName: '',
  fatherMobile: '',
  motherMobile: '',
  dob: '',
  bloodGroup: '',
  gender: '',
  address: '',
  instituteId: '',
  smsAlertTo: [],
};

interface AddStudentWizardProps {
  branches: Branch[];
  institutes: Institute[];
  onSuccess: () => Promise<void>;
}

export function AddStudentWizard({ branches, institutes, onSuccess }: AddStudentWizardProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programCourses, setProgramCourses] = useState<Course[]>([]);
  const [programId, setProgramId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [billingStartMonth, setBillingStartMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loadingCourses, setLoadingCourses] = useState(false);

  /** Per-course batch assignments: { [courseId]: batchId } */
  const [batchAssignments, setBatchAssignments] = useState<Record<string, string>>({});
  /** Available ACTIVE batches per course: { [courseId]: Batch[] } */
  const [availableBatches, setAvailableBatches] = useState<Record<string, Batch[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(false);

  /** Overall amounts for all selected courses; split by course fee weight when creating invoices. */
  const [totalDiscountAmount, setTotalDiscountAmount] = useState('');
  const [totalPaymentAmount, setTotalPaymentAmount] = useState('');
  const [discountReference, setDiscountReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile duplicate check
  const [mobileCheckState, setMobileCheckState] = useState<'idle' | 'checking' | 'exists' | 'clear'>('idle');
  const [existingStudent, setExistingStudent] = useState<{ id: string; fullName: string; registrationNumber: string | null } | null>(null);
  const [mobileDuplicateDismissed, setMobileDuplicateDismissed] = useState(false);
  const mobileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Monthly discount (recurring)
  const [monthlyDiscountAmount, setMonthlyDiscountAmount] = useState('');

  // One-time vs Monthly payment mode
  const [enrollPaymentMode, setEnrollPaymentMode] = useState<'ONE_TIME' | 'MONTHLY'>('MONTHLY');
  const [done, setDone] = useState<{
    studentId: string;
    roll: string;
    oneTimePassword?: string | null;
    email?: string;
    pdfUrl?: string | null;
    results: Array<{ courseName: string; pdfUrl: string | null; dueAmount: number; nextDue?: string }>;
  } | null>(null);

  useEffect(() => {
    getPrograms().then((res) => {
      if (res.success && res.data) setPrograms(res.data);
    });
  }, []);

  // Debounced mobile duplicate check
  useEffect(() => {
    const mobile = profile.mobile.trim();
    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      setMobileCheckState('idle');
      setExistingStudent(null);
      return;
    }
    setMobileCheckState('checking');
    if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current);
    mobileDebounceRef.current = setTimeout(async () => {
      try {
        const res = await checkDuplicateMobile(mobile);
        if (res.success && res.data?.exists) {
          setMobileCheckState('exists');
          setExistingStudent(res.data.student ?? null);
          setMobileDuplicateDismissed(false);
        } else {
          setMobileCheckState('clear');
          setExistingStudent(null);
        }
      } catch {
        setMobileCheckState('idle');
      }
    }, 500);
    return () => {
      if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.mobile]);

  useEffect(() => {
    if (!programId) {
      setProgramCourses([]);
      setSelectedCourseIds([]);
      setBatchAssignments({});
      setAvailableBatches({});
      return;
    }
    setBatchAssignments({});
    setAvailableBatches({});
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await getProgramById(programId);
        if (res.success && res.data?.courses) {
          const list = res.data.courses as Course[];
          setProgramCourses(list);
          setSelectedCourseIds([]);
        } else {
          setProgramCourses([]);
          setSelectedCourseIds([]);
        }
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [programId]);

  const courseById = useMemo(() => {
    const m = new Map<string, Course>();
    programCourses.forEach((c) => m.set(c.id, c));
    return m;
  }, [programCourses]);

  /** True when course delivery is in-person / center (API may send mixed casing). */
  const isOfflineCourseType = (type: Course['type'] | undefined) =>
    String(type ?? '').toUpperCase() === 'OFFLINE';

  // Refetch batches whenever enrollment branch or selected offline courses change (avoids stale cache and []-never-refetch bug).
  useEffect(() => {
    const offlineIds = selectedCourseIds.filter((id) => isOfflineCourseType(courseById.get(id)?.type));

    if (offlineIds.length === 0) {
      setAvailableBatches((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (!selectedCourseIds.includes(id)) delete next[id];
        }
        return next;
      });
      return;
    }

    let cancelled = false;
    setLoadingBatches(true);
    const branchForFetch = profile.branchId;

    // Drop cached rows for these courses so UI shows loading (not stale options from another branch)
    setAvailableBatches((prev) => {
      const next = { ...prev };
      for (const id of offlineIds) delete next[id];
      return next;
    });

    Promise.all(
      offlineIds.map(async (courseId) => {
        try {
          const res = await getBatches({
            courseId,
            ...(branchForFetch ? { branchId: branchForFetch } : {}),
            status: 'ACTIVE',
            limit: 100,
          });
          const batches = res.success && Array.isArray(res.data) ? res.data : [];
          return { courseId, batches };
        } catch {
          return { courseId, batches: [] as Batch[] };
        }
      }),
    )
      .then((results) => {
        if (cancelled) return;
        setAvailableBatches((prev) => {
          const next = { ...prev };
          for (const id of Object.keys(next)) {
            if (!selectedCourseIds.includes(id)) delete next[id];
          }
          for (const { courseId, batches } of results) {
            next[courseId] = batches;
          }
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingBatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourseIds, profile.branchId, courseById]);

  // Clear batch assignment when a course is deselected
  useEffect(() => {
    setBatchAssignments((prev) => {
      const next: Record<string, string> = {};
      for (const id of selectedCourseIds) {
        if (prev[id]) next[id] = prev[id];
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseIds]);

  // Batches are tied to branch — clear picks when enrollment branch changes
  useEffect(() => {
    setBatchAssignments({});
  }, [profile.branchId]);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAllCourses = () => {
    if (selectedCourseIds.length === programCourses.length) setSelectedCourseIds([]);
    else setSelectedCourseIds(programCourses.map((c) => c.id));
  };

  const totalCourseFee = useMemo(
    () => selectedCourseIds.reduce((s, id) => s + (Number(courseById.get(id)?.fee) || 0), 0),
    [selectedCourseIds, courseById],
  );

  /** One-time course fees (billingType = ONE_TIME) */
  const oneTimeCourseFees = useMemo(
    () => selectedCourseIds
      .filter((id) => courseById.get(id)?.billingType !== 'MONTHLY')
      .reduce((s, id) => s + (Number(courseById.get(id)?.fee) || 0), 0),
    [selectedCourseIds, courseById],
  );

  /** Monthly course fees (billingType = MONTHLY) */
  const monthlyCourseFees = useMemo(
    () => selectedCourseIds
      .filter((id) => courseById.get(id)?.billingType === 'MONTHLY')
      .reduce((s, id) => s + (Number(courseById.get(id)?.fee) || 0), 0),
    [selectedCourseIds, courseById],
  );

  /**
   * Admission fee programs: derived from the currently selected program in the `programs` list
   * (the courses themselves don't carry nested program admission-fee fields).
   */
  const admissionFeePrograms = useMemo(() => {
    const prog = programs.find((p) => p.id === programId);
    if (!prog?.admissionFeeEnabled || !prog?.admissionFeeAmount || Number(prog.admissionFeeAmount) <= 0) return [];
    if (selectedCourseIds.length === 0) return [];
    return [{ id: prog.id, name: prog.name, amount: Number(prog.admissionFeeAmount) }];
  }, [programs, programId, selectedCourseIds]);

  /**
   * Admin-editable overrides for the admission fee (per program).
   * Initialised from program defaults; admin can change before submitting.
   */
  const [admissionFeeOverrides, setAdmissionFeeOverrides] = useState<Record<string, string>>({});

  // Re-seed overrides whenever the program changes
  useEffect(() => {
    if (!admissionFeePrograms.length) return;
    setAdmissionFeeOverrides((prev) => {
      const next: Record<string, string> = {};
      for (const p of admissionFeePrograms) {
        // Keep existing edits; seed defaults for newly appearing programs
        next[p.id] = prev[p.id] ?? String(p.amount);
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const effectiveAdmissionFeeTotal = useMemo(
    // Fall back to p.amount when overrides haven't been seeded yet (avoids showing 0)
    () => admissionFeePrograms.reduce((s, p) => s + (Number(admissionFeeOverrides[p.id] ?? p.amount) || 0), 0),
    [admissionFeePrograms, admissionFeeOverrides],
  );

  /** Legacy alias so info-banners in course-step still work */
  const totalAdmissionFee = effectiveAdmissionFeeTotal;

  const totalDiscountNum = Number(totalDiscountAmount) || 0;
  const totalMonthlyDiscountNum = enrollPaymentMode === 'ONE_TIME' ? 0 : (Number(monthlyDiscountAmount) || 0);
  const totalPaymentNum = Number(totalPaymentAmount) || 0;

  /** Course + admission (matches backend invoice line total before discounts). */
  const grossBeforeDiscount = useMemo(
    () => totalCourseFee + effectiveAdmissionFeeTotal,
    [totalCourseFee, effectiveAdmissionFeeTotal],
  );

  const netPayable = useMemo(
    () => netPayableAfterAdjustments(grossBeforeDiscount, totalDiscountNum + totalMonthlyDiscountNum),
    [grossBeforeDiscount, totalDiscountNum, totalMonthlyDiscountNum],
  );

  const balanceAfterPay = useMemo(
    () => Math.max(0, Math.round((netPayable - totalPaymentNum) * 100) / 100),
    [netPayable, totalPaymentNum],
  );

  const adjustmentsOverTotalFees =
    grossBeforeDiscount > 0 && totalDiscountNum + totalMonthlyDiscountNum > grossBeforeDiscount + 1e-6;

  const maxDiscountAllowed = Math.max(0, Math.round((grossBeforeDiscount - totalMonthlyDiscountNum) * 100) / 100);

  /** Payment type badge label (OFFLINE / ONLINE / MIXED) */
  const paymentTypeBadge = useMemo(() => {
    if (selectedCourseIds.length === 0) return null;
    const types = new Set(selectedCourseIds.map((id) => String(courseById.get(id)?.type ?? '').toUpperCase()));
    if (types.has('OFFLINE') && types.has('ONLINE')) return 'MIXED';
    if (types.has('OFFLINE')) return 'OFFLINE';
    return 'ONLINE';
  }, [selectedCourseIds, courseById]);

  const paymentFieldsLocked = adjustmentsOverTotalFees;

  useEffect(() => {
    setTotalPaymentAmount((prev) => {
      const pay = Number(prev) || 0;
      if (pay > netPayable + 0.0001) return String(netPayable);
      return prev;
    });
  }, [netPayable]);

  const distributedPreview = useMemo(() => {
    const feeFn = (id: string) => Number(courseById.get(id)?.fee) || 0;
    const discMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalDiscountNum);
    const payMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalPaymentNum);
    const rows = selectedCourseIds.map((id) => {
      const fee = feeFn(id);
      const d = discMap[id] ?? 0;
      const p = payMap[id] ?? 0;
      const payable = Math.max(fee - d, 0);
      const due = Math.max(payable - p, 0);
      return { id, fee, disc: d, pay: p, payable, due };
    });
    return { rows };
  }, [selectedCourseIds, courseById, totalDiscountNum, totalPaymentNum]);

  const WIZARD_STEP_LABELS = ['Register', 'Courses', 'Payment', 'Confirm'] as const;

  const validateStep1 = (): boolean => {
    if (!profile.fullName.trim() || !profile.mobile.trim()) {
      setError('Name and mobile are required.');
      return false;
    }
    if (!/^01[3-9]\d{8}$/.test(profile.mobile.trim())) {
      setError('Mobile must be a valid 11-digit BD number (e.g. 017XXXXXXXX).');
      return false;
    }
    if (mobileCheckState === 'exists' && !mobileDuplicateDismissed) {
      setError('এই নম্বরে আগে থেকে একজন Student আছেন। তবুও নতুন করতে চাইলে "তবুও নতুন করুন" তে ক্লিক করুন।');
      return false;
    }
    if (!profile.branchId) {
      setError('Select a branch.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!programId || selectedCourseIds.length === 0) {
      setError('Choose a program and at least one course.');
      return false;
    }
    if (!profile.branchId) {
      setError('Select a branch for enrollment.');
      return false;
    }
    const needsMonth = selectedCourseIds.some((id) => courseById.get(id)?.billingType === 'MONTHLY');
    if (needsMonth && !/^\d{4}-\d{2}$/.test(billingStartMonth.trim())) {
      setError('Billing month (YYYY-MM) is required for monthly course(s).');
      return false;
    }
    // Offline courses must have a batch assigned
    const offlineWithoutBatch = selectedCourseIds.filter(
      (id) => isOfflineCourseType(courseById.get(id)?.type) && !batchAssignments[id],
    );
    if (offlineWithoutBatch.length > 0) {
      const names = offlineWithoutBatch.map((id) => courseById.get(id)?.name || id).join(', ');
      setError(`Please select a batch for each offline course: ${names}`);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    const v = validateAdmissionPayment(
      grossBeforeDiscount,
      'offline',
      {
        totalDiscountAmount,
        totalPaymentAmount,
        discountReference,
        paymentMethod,
        paymentTrxId,
      },
      { otherDiscountAmount: totalMonthlyDiscountNum },
    );
    if (v.ok === false) {
      setError(v.message);
      return false;
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2) {
      if (!validateStep2()) return;
      if (!billingStartMonth.trim()) {
        const needsMonth = selectedCourseIds.some((id) => courseById.get(id)?.billingType === 'MONTHLY');
        if (needsMonth) setBillingStartMonth(new Date().toISOString().slice(0, 7));
      }
      let sumOffer = 0;
      let offerNote = '';
      for (const id of selectedCourseIds) {
        const c = courseById.get(id);
        const o =
          c?.offerDiscountAmount != null && String(c.offerDiscountAmount) !== ''
            ? Number(c.offerDiscountAmount)
            : 0;
        sumOffer += o;
        if (o > 0 && c?.offerDiscountNote && !offerNote) offerNote = String(c.offerDiscountNote).trim();
      }
      const tf = selectedCourseIds.reduce((s, id) => s + (Number(courseById.get(id)?.fee) || 0), 0);
      const admissionTotal = admissionFeePrograms.reduce(
        (s, p) => s + (Number(admissionFeeOverrides[p.id] ?? p.amount) || 0),
        0,
      );
      setTotalDiscountAmount(sumOffer > 0 ? String(Math.round(sumOffer * 100) / 100) : '');
      setDiscountReference(offerNote);
      setTotalPaymentAmount(String(Math.round(Math.max(tf + admissionTotal - sumOffer, 0) * 100) / 100));
      // Auto-set payment mode based on selected course billing types
      const hasMonthly = selectedCourseIds.some((id) => courseById.get(id)?.billingType === 'MONTHLY');
      setEnrollPaymentMode(hasMonthly ? 'MONTHLY' : 'ONE_TIME');
    }
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    if (!validateStep3()) return;
    if (!profile.branchId || selectedCourseIds.length === 0) {
      setError('Branch and at least one course are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const createRes = await createStudent({
        fullName: profile.fullName.trim(),
        email: profile.email.trim() || undefined,
        mobile: profile.mobile.trim(),
        branchId: profile.branchId || undefined,
        status: profile.status,
        fatherName: profile.fatherName.trim() || undefined,
        motherName: profile.motherName.trim() || undefined,
        fatherMobile: profile.fatherMobile.trim() || undefined,
        motherMobile: profile.motherMobile.trim() || undefined,
        dob: profile.dob || undefined,
        bloodGroup: profile.bloodGroup || undefined,
        gender: profile.gender || undefined,
        address: profile.address.trim() || undefined,
        instituteId: profile.instituteId || undefined,
        primaryMobile: profile.mobile.trim(),
        smsAlertTo: profile.smsAlertTo.length ? profile.smsAlertTo : undefined,
      });

      if (!createRes.success || !createRes.data?.id) {
        throw new Error(createRes.message || 'Failed to create student');
      }

      const studentUserId = createRes.data.id;
      const roll = createRes.data.studentProfile?.registrationNumber || '—';
      const otp = createRes.data.oneTimePassword;

      const monthYm = billingStartMonth.trim();
      const nextDueIso = nextPaymentDueDate
        ? new Date(`${nextPaymentDueDate}T12:00:00`).toISOString()
        : undefined;

      const discTotal = Number(totalDiscountAmount) || 0;
      const payTotal = Number(totalPaymentAmount) || 0;
      const refTrim = discountReference.trim();
      const needsMonth = selectedCourseIds.some((id) => courseById.get(id)?.billingType === 'MONTHLY');

      const feeOverrides: Record<string, number> = {};
      for (const p of admissionFeePrograms) {
        const v = Number(admissionFeeOverrides[p.id]);
        if (!Number.isNaN(v) && v >= 0) feeOverrides[p.id] = v;
      }

      const adm = await offlineAdmission({
        studentUserId,
        branchId: profile.branchId,
        courses: selectedCourseIds.map((courseId) => ({
          courseId,
          batchId: batchAssignments[courseId] || undefined,
        })),
        billingStartMonth: needsMonth ? monthYm || undefined : undefined,
        paymentMethod,
        paymentAmount: payTotal,
        paymentTrxId: payTotal > 0 && paymentMethod !== 'CASH' ? paymentTrxId.trim() || undefined : undefined,
        discountAmount: discTotal > 0 ? discTotal : undefined,
        discountReference: discTotal > 0 ? refTrim : undefined,
        monthlyDiscountAmount: totalMonthlyDiscountNum > 0 ? totalMonthlyDiscountNum : undefined,
        nextPaymentDueDate: nextDueIso,
        admissionFeeAmountOverrides: Object.keys(feeOverrides).length > 0 ? feeOverrides : undefined,
      }, `wizard-${studentUserId}-${Date.now()}`);

      if (!adm.success || !adm.data) {
        throw new Error(adm.message || 'Admission failed');
      }

      const dueNum = Number(adm.data.invoice.dueAmount);
      const nextDueRaw = adm.data.invoice.nextPaymentDueDate;
      const nextDueStr = nextDueRaw
        ? format(new Date(nextDueRaw), 'dd MMM yyyy')
        : nextPaymentDueDate
          ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy')
          : undefined;

      const courseLabels = selectedCourseIds
        .map((id) => courseById.get(id)?.name)
        .filter(Boolean)
        .join(', ');
      const results = [
        {
          courseName:
            selectedCourseIds.length > 1
              ? `${selectedCourseIds.length} courses — ${courseLabels || 'combined invoice'}`
              : courseLabels || 'Course',
          pdfUrl: adm.data.pdfUrl,
          dueAmount: Number.isFinite(dueNum) ? dueNum : 0,
          nextDue: nextDueStr,
        },
      ];

      setDone({ studentId: studentUserId, roll, oneTimePassword: otp, email: profile.email.trim() || undefined, pdfUrl: adm.data.pdfUrl, results });

      toast({
        title: 'Admission complete',
        description: `${selectedCourseIds.length} course(s) enrolled — one combined invoice.`,
        variant: 'success',
      });
      await onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col h-full max-h-[85vh] bg-white text-slate-900">
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">ভর্তি সম্পন্ন</h3>
            <p className="text-sm text-slate-600">
              রেজিস্ট্রেশন নম্বর ও পাসওয়ার্ড সংরক্ষণ করুন। Student মোবাইল + পাসওয়ার্ড দিয়ে লগইন করবে।
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">রেজিস্ট্রেশন নম্বর</p>
                <p className="font-mono text-xl font-black text-slate-900">{done.roll}</p>
              </div>
              {done.oneTimePassword ? (
                <div className="rounded-2xl bg-white border border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    প্রাথমিক পাসওয়ার্ড
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xl font-black text-indigo-700 flex-1">{done.oneTimePassword}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(done.oneTimePassword!);
                        toast({ title: 'Copied', description: 'Password copied to clipboard', variant: 'success' });
                      }}
                      className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* SMS / Email credential buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold"
                onClick={async () => {
                  try {
                    await sendCredentialsSms(done.studentId);
                    toast({ title: 'SMS পাঠানো হয়েছে', description: 'Credentials SMS sent successfully', variant: 'success' });
                  } catch (e: unknown) {
                    toast({ title: 'Error', description: e instanceof Error ? e.message : 'SMS failed', variant: 'destructive' });
                  }
                }}
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                SMS পাঠান
              </Button>
              {done.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                  onClick={async () => {
                    try {
                      await sendCredentialsEmail(done.studentId);
                      toast({ title: 'Email পাঠানো হয়েছে', description: 'Credentials email sent', variant: 'success' });
                    } catch (e: unknown) {
                      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Email failed', variant: 'destructive' });
                    }
                  }}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Email পাঠান
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice</p>
              {done.results.map((r, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                  <p className="text-sm font-black text-slate-800">{r.courseName}</p>
                  <p className="text-lg font-black text-amber-800">Due: {r.dueAmount.toFixed(2)} BDT</p>
                  {r.nextDue ? <p className="text-xs font-bold text-slate-600">Next payment: {r.nextDue}</p> : null}
                  {r.pdfUrl ? (
                    <Button className="h-10 rounded-xl bg-slate-900 font-black uppercase text-[10px] text-white" asChild>
                      <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Invoice PDF
                      </a>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-slate-100 px-8 pb-8 pt-6">
          <Button
            className="w-full h-14 rounded-2xl bg-indigo-600 font-black uppercase tracking-[0.2em] text-[11px] text-white"
            onClick={closeModal}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-white text-slate-900">
      <div className="border-b border-slate-100 px-4 pt-6 pb-4 sm:px-8">
        <div className="mb-1 grid w-full grid-cols-4 gap-1 sm:gap-2">
          {WIZARD_STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex flex-col items-center px-0.5 text-center">
                <div
                  className={cn(
                    'mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold sm:h-9 sm:w-9 sm:text-xs',
                    done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : n}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold leading-tight sm:text-[11px]',
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

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar space-y-8">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Account & branch</h3>
                <p className="text-xs text-slate-400">Roll and password are created automatically on submit (step 3).</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>Full name</label>
                <Input
                  className={inputClass}
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Student name"
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Mobile (login)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11',
                      mobileCheckState === 'exists' && !mobileDuplicateDismissed ? 'border-amber-400 bg-amber-50' :
                      mobileCheckState === 'clear' ? 'border-emerald-400' : ''
                    )}
                    value={profile.mobile}
                    onChange={(e) => setProfile((p) => ({ ...p, mobile: e.target.value }))}
                    placeholder="017XXXXXXXX"
                  />
                  {mobileCheckState === 'checking' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  )}
                  {mobileCheckState === 'clear' && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {mobileCheckState === 'exists' && !mobileDuplicateDismissed && existingStudent && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                    <p className="text-xs font-bold text-amber-800">
                      ⚠ এই নম্বরে আগে থেকে একজন Student আছেন: <strong>{existingStudent.fullName}</strong>
                      {existingStudent.registrationNumber ? ` (রেজি. ${existingStudent.registrationNumber})` : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-[11px] h-7 border-amber-300 text-amber-800 hover:bg-amber-100"
                        onClick={() => window.open(`/admin/students/${existingStudent!.id}`, '_blank')}
                      >
                        বিদ্যমান Student দেখুন
                      </Button>
                     
                    </div>
                  </div>
                )}
                <p className="text-[10px] font-bold text-slate-400">
                  রেজিস্ট্রেশন নম্বর: পরবর্তী ধাপে স্বয়ংক্রিয়ভাবে তৈরি হবে (৭ সংখ্যার)
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>ইমেইল (ঐচ্ছিক)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Branch</label>
                <Select value={profile.branchId} onValueChange={(v) => setProfile((p) => ({ ...p, branchId: v }))}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Status</label>
                <Select
                  value={profile.status}
                  onValueChange={(v) => setProfile((p) => ({ ...p, status: v as UserStatus }))}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Institute (optional)</label>
                <InstituteCombobox
                  institutes={institutes}
                  value={profile.instituteId}
                  onSelect={(v) => setProfile((p) => ({ ...p, instituteId: v }))}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 space-y-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-slate-400" />
                <h4 className="text-sm font-black text-slate-700">Optional — guardians</h4>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Father name</label>
                  <Input
                    className={inputClass}
                    value={profile.fatherName}
                    onChange={(e) => setProfile((p) => ({ ...p, fatherName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother name</label>
                  <Input
                    className={inputClass}
                    value={profile.motherName}
                    onChange={(e) => setProfile((p) => ({ ...p, motherName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Father mobile</label>
                  <Input
                    className={inputClass}
                    value={profile.fatherMobile}
                    onChange={(e) => setProfile((p) => ({ ...p, fatherMobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother mobile</label>
                  <Input
                    className={inputClass}
                    value={profile.motherMobile}
                    onChange={(e) => setProfile((p) => ({ ...p, motherMobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Date of birth</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 font-bold',
                          !profile.dob && 'text-slate-400',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {profile.dob ? format(parseDateInput(profile.dob)!, 'dd-MM-yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar
                        selected={parseDateInput(profile.dob)}
                        onSelect={(date) => setProfile((p) => ({ ...p, dob: formatDateInput(date) }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Gender</label>
                  <Select value={profile.gender} onValueChange={(v) => setProfile((p) => ({ ...p, gender: v }))}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="MALE">MALE</SelectItem>
                      <SelectItem value="FEMALE">FEMALE</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Address</label>
                  <textarea
                    className="w-full min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold"
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>SMS alerts</label>
                  <div className="flex flex-wrap gap-6">
                    {(['SELF', 'FATHER', 'MOTHER'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                        <Checkbox
                          checked={profile.smsAlertTo.includes(opt)}
                          onCheckedChange={(checked) =>
                            setProfile((p) => ({
                              ...p,
                              smsAlertTo: checked
                                ? [...p.smsAlertTo, opt]
                                : p.smsAlertTo.filter((x) => x !== opt),
                            }))
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Library className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Choose courses</h3>
                <p className="text-xs text-slate-500">
                  Pick one or more courses from the program. Each row shows <strong>Offline</strong> (in-person / center) or{' '}
                  <strong>Online</strong> (remote / portal) — that is how the course is delivered, not how payment is collected.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Program</label>
              {programs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-sm font-semibold text-amber-900">
                  No programs loaded. Check your connection or create a program first.
                </p>
              ) : (
                <Select
                  value={programId || undefined}
                  onValueChange={(v) => setProgramId(v)}
                >
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Select a program above to list its courses for this admission.
              </div>
            ) : loadingCourses ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : programCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
                This program has no courses attached yet.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase" onClick={toggleAllCourses}>
                    {selectedCourseIds.length === programCourses.length ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                {programCourses.map((c) => {
                  const sel = selectedCourseIds.includes(c.id);
                  const isOffline = isOfflineCourseType(c.type);
                  const batches = availableBatches[c.id] ?? [];
                  const assignedBatch = batchAssignments[c.id] ?? '';
                  const batchMissing = sel && isOffline && !assignedBatch;
                  const batchLoadPending = loadingBatches && !(c.id in availableBatches);
                  return (
                    <div key={c.id} className="space-y-0">
                      <button
                        type="button"
                        onClick={() => toggleCourse(c.id)}
                        className={cn(
                          'flex w-full items-center justify-between p-4 text-left transition-all',
                          sel && isOffline ? 'rounded-t-2xl' : 'rounded-2xl',
                          sel
                            ? batchMissing
                              ? 'border border-b-0 border-amber-300 bg-amber-50/50'
                              : 'border border-b-0 border-indigo-300 bg-indigo-50/50'
                            : 'rounded-2xl border border-slate-100 hover:border-slate-200',
                          !sel && 'rounded-2xl',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={sel} className="pointer-events-none" />
                          <Layers className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-black text-slate-800">{c.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <CourseDeliveryBadge type={c.type} />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {c.code} · {Number(c.fee).toFixed(0)} BDT ·{' '}
                                {c.billingType === 'MONTHLY' ? 'MONTHLY' : 'ONE-TIME'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {sel ? (
                          <div className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            batchMissing ? 'bg-amber-400' : 'bg-indigo-600',
                          )}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : null}
                      </button>

                      {/* Batch selector — shown only when course is selected */}
                      {sel && isOffline && (
                        <div
                          className={cn(
                            'rounded-b-2xl border border-t-0 px-4 pb-3 pt-2',
                            batchMissing ? 'border-amber-300 bg-amber-50/30' : 'border-indigo-300 bg-indigo-50/30',
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Batch <span className="text-rose-500">*</span>
                          </label>
                          {!profile.branchId ? (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                              Select a <strong>branch</strong> in the profile section to load batches for this offline course.
                            </p>
                          ) : batchLoadPending ? (
                            <div className="flex items-center gap-2 py-2 text-xs font-bold text-slate-400">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                              Loading batches…
                            </div>
                          ) : batches.length === 0 ? (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                              No active batches for this course at this branch. Create a batch in admin or pick another branch.
                            </p>
                          ) : (
                            <Select
                              value={assignedBatch || undefined}
                              onValueChange={(v) =>
                                setBatchAssignments((prev) => ({ ...prev, [c.id]: v }))
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  'h-10 rounded-xl border font-bold text-sm',
                                  batchMissing
                                    ? 'border-amber-300 bg-white text-amber-900'
                                    : 'border-indigo-200 bg-white text-slate-800',
                                )}
                              >
                                <SelectValue placeholder="Select batch (required for offline)" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {batches.map((b) => (
                                  <SelectItem key={b.id} value={b.id} className="font-bold">
                                    {b.name}
                                    {b.startDate ? (
                                      <span className="ml-2 text-[10px] font-medium text-slate-400">
                                        · starts {new Date(b.startDate).toLocaleDateString('en-BD')}
                                      </span>
                                    ) : null}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {batchMissing && (
                            <p className="mt-1 text-[10px] font-bold text-amber-700">
                              Batch is required for offline courses. Please select one to continue.
                            </p>
                          )}
                        </div>
                      )}


                    </div>
                  );
                })}
              </div>
            )}
            {selectedCourseIds.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment type:</span>
                <span className={cn(
                  'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest',
                  paymentTypeBadge === 'OFFLINE' ? 'bg-violet-100 text-violet-700' :
                  paymentTypeBadge === 'ONLINE'  ? 'bg-sky-100 text-sky-700' :
                  'bg-amber-100 text-amber-700',
                )}>
                  {paymentTypeBadge}
                </span>
              </div>
            )}
            <div className="grid gap-6 border-t border-slate-100 pt-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>First billing month (monthly courses)</label>
                <MonthYearPicker
                  value={billingStartMonth}
                  onChange={setBillingStartMonth}
                  placeholder="Select month"
                />
                <p className="text-[10px] text-slate-400 font-bold">Required when any selected course is monthly.</p>
              </div>

              {admissionFeePrograms.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1 sm:col-span-2">
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
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* ── Payment mode toggle ── */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-1.5 flex">
              <button
                type="button"
                onClick={() => setEnrollPaymentMode('ONE_TIME')}
                className={cn(
                  'flex-1 rounded-xl py-3 text-center text-xs font-black uppercase tracking-widest transition-all',
                  enrollPaymentMode === 'ONE_TIME'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-white',
                )}
              >
                একবারে পরিশোধ (One-time)
              </button>
              <button
                type="button"
                onClick={() => setEnrollPaymentMode('MONTHLY')}
                className={cn(
                  'flex-1 rounded-xl py-3 text-center text-xs font-black uppercase tracking-widest transition-all',
                  enrollPaymentMode === 'MONTHLY'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-white',
                )}
              >
                মাসিক কিস্তি (Monthly)
              </button>
            </div>

            {/* ── Categorized fees ── */}
            {/* One-time charges */}
            {(oneTimeCourseFees > 0 || effectiveAdmissionFeeTotal > 0) && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-2">একবারের চার্জ (One-time)</p>
                {admissionFeePrograms.length > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-sm border-b border-violet-100">
                    <span className="text-slate-600">Admission fee</span>
                    <span className="font-mono font-bold">৳{effectiveAdmissionFeeTotal.toLocaleString()}</span>
                  </div>
                )}
                {selectedCourseIds.filter((id) => courseById.get(id)?.billingType !== 'MONTHLY').map((cid) => {
                  const c = courseById.get(cid);
                  const fee = c?.fee != null ? Number(c.fee) : 0;
                  return (
                    <div key={cid} className="flex items-center justify-between py-1.5 text-sm border-b border-violet-100 last:border-b-0">
                      <span className="text-slate-600">{c?.name}</span>
                      <span className="font-mono font-bold">৳{fee.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 text-sm font-bold">
                  <span className="text-violet-700">মোট একবার</span>
                  <span className="font-mono text-violet-800">৳{(oneTimeCourseFees + effectiveAdmissionFeeTotal).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Monthly charges */}
            {monthlyCourseFees > 0 && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/30 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-2">মাসিক চার্জ (Monthly recurring)</p>
                {selectedCourseIds.filter((id) => courseById.get(id)?.billingType === 'MONTHLY').map((cid) => {
                  const c = courseById.get(cid);
                  const fee = c?.fee != null ? Number(c.fee) : 0;
                  return (
                    <div key={cid} className="flex items-center justify-between py-1.5 text-sm border-b border-sky-100 last:border-b-0">
                      <span className="text-slate-600">{c?.name}</span>
                      <span className="font-mono font-bold">৳{fee.toLocaleString()}/mo</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 text-sm font-bold">
                  <span className="text-sky-700">মোট মাসিক</span>
                  <span className="font-mono text-sky-800">৳{monthlyCourseFees.toLocaleString()}/mo</span>
                </div>
              </div>
            )}

            {/* ── Admission Fee (editable) ── */}
            {admissionFeePrograms.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/40">
                <div className="flex items-center gap-3 border-b border-indigo-100 bg-indigo-600 px-4 py-3">
                  <GraduationCap className="h-4 w-4 shrink-0 text-white/80" />
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
                          Default: ৳{p.amount.toLocaleString()} · Edit below to override
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

            {/* ── Special Discount (one-time, program-wise) ── */}
            <div className="space-y-2">
              <label className={sectionLabel}>Special Discount (একবার, প্রোগ্রামভিত্তিক)</label>
              <Input
                className={cn(
                  inputClass,
                  adjustmentsOverTotalFees ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-500/15' : '',
                )}
                type="number"
                min={0}
                step="0.01"
                value={totalDiscountAmount}
                onChange={(e) => setTotalDiscountAmount(e.target.value)}
                placeholder="0"
              />
              {adjustmentsOverTotalFees && (
                <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Discount ({(totalDiscountNum + totalMonthlyDiscountNum).toFixed(2)} BDT) exceeds billable total (
                    {grossBeforeDiscount.toFixed(2)} BDT).
                    Max: {maxDiscountAllowed.toFixed(2)} BDT
                  </span>
                </div>
              )}
            </div>

            {/* ── Monthly Discount — only if monthly payment mode ── */}
            {enrollPaymentMode === 'MONTHLY' && (
              <div className="space-y-2">
                <label className={sectionLabel}>Monthly Discount (প্রতি মাসে প্রযোজ্য)</label>
                <Input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.01"
                  value={monthlyDiscountAmount}
                  onChange={(e) => setMonthlyDiscountAmount(e.target.value)}
                  placeholder="0"
                />
                <p className="text-[10px] font-medium text-slate-400">প্রতি মাসে এই পরিমাণ ছাড় পাবেন।</p>
              </div>
            )}

            {/* ── Discount reference ── */}
            <div className="space-y-2">
              <label className={sectionLabel}>Discount reference (required if discount &gt; 0)</label>
              <Input
                className={inputClass}
                value={discountReference}
                onChange={(e) => setDiscountReference(e.target.value)}
                placeholder="Offer code, approver…"
              />
            </div>

            <hr className="border-slate-200" />

            {/* ── Fee totals card ── */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-1">
              <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-100">
                <span className="text-slate-600">Course fees</span>
                <span className="font-mono font-bold">৳{totalCourseFee.toLocaleString()}</span>
              </div>
              {effectiveAdmissionFeeTotal > 0 && (
                <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-100">
                  <span className="text-slate-600">Admission fees</span>
                  <span className="font-mono font-bold">৳{effectiveAdmissionFeeTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-100">
                <span className="text-slate-600">Special Discount</span>
                <span className="font-mono font-bold text-rose-600">− ৳{totalDiscountNum.toLocaleString()}</span>
              </div>
              {enrollPaymentMode === 'MONTHLY' && totalMonthlyDiscountNum > 0 && (
                <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-100">
                  <span className="text-slate-600">Monthly Discount</span>
                  <span className="font-mono font-bold text-rose-600">− ৳{totalMonthlyDiscountNum.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 text-sm font-bold">
                <span>মোট পরিশোধযোগ্য</span>
                <span className="font-mono text-indigo-800">৳{netPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* ── Paid amount ── */}
            <div className="space-y-2">
              <label className={sectionLabel}>পরিশোধিত পরিমাণ</label>
              <Input
                className={cn(inputClass, paymentFieldsLocked && 'cursor-not-allowed bg-slate-100 text-slate-500')}
                type="number"
                min={0}
                step="0.01"
                value={totalPaymentAmount}
                onChange={(e) => setTotalPaymentAmount(e.target.value)}
                disabled={paymentFieldsLocked}
                placeholder="0"
              />
              {!paymentFieldsLocked && totalPaymentNum > netPayable && (
                <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    Pay today ({totalPaymentNum.toFixed(2)}) &gt; Net payable ({netPayable.toFixed(2)}). Overpayment is not allowed.
                  </span>
                </div>
              )}
            </div>

            {/* ── Paid / Due card ── */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-1">
              <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-100">
                <span className="text-slate-600">পরিশোধিত</span>
                <span className="font-mono font-bold text-emerald-600">৳{totalPaymentNum.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm font-bold">
                <span>বাকি (Due)</span>
                <span className="font-mono font-bold text-rose-600">৳{balanceAfterPay.toLocaleString()}</span>
              </div>
            </div>

            {/* ── Payment Mode ── */}
            <div className="space-y-2">
              <label className={sectionLabel}>Payment Mode</label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}
                disabled={paymentFieldsLocked}
              >
                <SelectTrigger
                  className={cn(
                    'h-12 rounded-2xl border-slate-200 font-bold',
                    paymentFieldsLocked ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'bg-white',
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

            {/* ── Transaction Reference (bKash only) ── */}
            {paymentMethod === 'BKASH' && (
              <div className="space-y-2">
                <label className={sectionLabel}>Transaction Reference *</label>
                <Input
                  className={inputClass}
                  value={paymentTrxId}
                  onChange={(e) => setPaymentTrxId(e.target.value)}
                  placeholder="TXN ID / Ref নম্বর দিন"
                />
              </div>
            )}

            {/* ── Next payment date ── */}
            <div className="space-y-2">
              <label className={sectionLabel}>Next payment date (all invoices)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-12 w-full justify-start rounded-2xl border-slate-200 bg-white font-bold shadow-sm',
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
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-800">চূড়ান্ত নিশ্চিতকরণ</h3>
              <p className="mt-2 text-xs font-bold text-slate-600">
                তথ্য সঠিক হলে &ldquo;ভর্তি সম্পন্ন করুন&rdquo; চাপুন। Invoice তৈরি হবে — PDF ডাউনলোড ও SMS পাঠানো যাবে।
              </p>
            </div>

            {/* Key-value summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program</span>
                <span className="font-black text-slate-800">{programs.find((p) => p.id === programId)?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Branch</span>
                <span className="font-bold text-slate-700">{branches.find((b) => b.id === profile.branchId)?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">কোর্সসমূহ</span>
                <span className="font-bold text-slate-700 text-right max-w-[60%]">
                  {selectedCourseIds.map((id) => courseById.get(id)?.name).filter(Boolean).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Type</span>
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase',
                  enrollPaymentMode === 'ONE_TIME' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700',
                )}>
                  {enrollPaymentMode === 'ONE_TIME' ? 'একবারে (One-time)' : 'মাসিক (Monthly)'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Billing month</span>
                <span className="font-bold text-slate-700">{billingStartMonth || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Course fees</span>
                <span className="font-mono font-black text-slate-800">৳{totalCourseFee.toFixed(2)}</span>
              </div>
              {effectiveAdmissionFeeTotal > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admission fees</span>
                  <span className="font-mono font-black text-slate-800">৳{effectiveAdmissionFeeTotal.toFixed(2)}</span>
                </div>
              )}
              {totalDiscountNum > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Special Discount</span>
                  <span className="font-mono font-black text-amber-700">−৳{totalDiscountNum.toFixed(2)}</span>
                </div>
              )}
              {totalMonthlyDiscountNum > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">মাসিক ছাড়</span>
                  <span className="font-mono font-black text-violet-700">−৳{totalMonthlyDiscountNum.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Net Payable</span>
                <span className="font-mono font-black text-indigo-800">৳{netPayable.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pay today</span>
                <span className="font-mono font-bold text-slate-700">৳{totalPaymentNum.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">বাকি (Due)</span>
                <span className="font-mono font-bold text-rose-600">৳{balanceAfterPay.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment mode</span>
                <span className="font-bold text-slate-700">{paymentMethod}{paymentMethod === 'BKASH' && paymentTrxId.trim() ? ` — ${paymentTrxId.trim()}` : ''}</span>
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm">
              <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-sky-500 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">i</span>
              </div>
              <p className="font-bold text-sky-800">
                Invoice তৈরি হবে — PDF ডাউনলোড ও SMS পাঠানো যাবে। Student-এর পোর্টাল লগইনের জন্য OTP জেনারেট হবে।
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-black uppercase tracking-widest text-rose-600">
            {error}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-8 pb-8 pt-6 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="h-14 rounded-2xl flex-1 font-black uppercase tracking-widest text-[11px] bg-slate-700 text-white border-slate-700 hover:bg-slate-800 hover:text-white"
          onClick={step === 1 ? closeModal : goBack}
        >
          {step === 1 ? (
            'Cancel'
          ) : (
            <>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </>
          )}
        </Button>
        {step < 4 ? (
          <Button
            className="h-14 flex-[2] rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white hover:bg-slate-900 hover:text-white"
            onClick={goNext}
            disabled={step === 3 && adjustmentsOverTotalFees}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="h-14 flex-[2] rounded-2xl bg-emerald-600 font-black uppercase tracking-widest text-[11px] text-white hover:bg-emerald-700 hover:text-white"
            onClick={handleFinish}
            disabled={submitting}
          >
            {submitting ? 'সংরক্ষণ হচ্ছে…' : 'ভর্তি সম্পন্ন করুন'}
          </Button>
        )}
      </div>
    </div>
  );
}
