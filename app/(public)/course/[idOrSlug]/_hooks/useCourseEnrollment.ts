'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  checkEnrollment,
  createSelfCheckoutOrder,
  getEnrollCourseQuote,
  type EnrollCourseDelivery,
  type EnrollCourseQuote,
} from '@/lib/api/student-portal';
import { ApiError } from '@/lib/api';
import { initSelfCheckoutPayment } from '@/lib/api/payment-gateway';
import { getMyStudentProfile } from '@/lib/api/student-profiles';
import {
  isLoggedInNonStudent,
  isStudentOnlyRestriction,
  resolveStudentOnlyMessage,
  STUDENT_ONLY_COURSE_PURCHASE_MESSAGE,
} from '@/lib/student-purchase-access';
import type { CourseDetailBatch, CourseDetailCourseBook, CourseDetails } from '@/types/course';

function hasAuthToken(): boolean {
  return typeof window !== 'undefined' && Boolean(localStorage.getItem('auth_token'));
}

function isAuthApiError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 401) return true;
  const msg = err instanceof Error ? err.message : '';
  return /authentication required|please log in|log in again|session expired/i.test(msg);
}

type ApiErrorWithResponse = Error & {
  response?: { message?: string; data?: { enrollmentId?: string } };
};

type DeliveryState = {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

export function useCourseEnrollment(course: CourseDetails | null, idOrSlug: string) {
  const { toast } = useToast();
  const courseId = course?.id ?? '';

  const [enrolling, setEnrolling] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [selectedPaidBookIds, setSelectedPaidBookIds] = useState<string[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryState>({
    recipientName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });
  const [offlineBatches, setOfflineBatches] = useState<CourseDetailBatch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [savedBranch, setSavedBranch] = useState<{ id: string; name: string } | null>(null);
  const [branchProfileLoading, setBranchProfileLoading] = useState(false);
  const [checkoutQuote, setCheckoutQuote] = useState<EnrollCourseQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!course || course.type !== 'OFFLINE') {
      setOfflineBatches([]);
      return;
    }
    setOfflineBatches((course.batches ?? []).filter((batch) => batch.status === 'ACTIVE'));
  }, [course]);

  const branchBatches = useMemo(
    () => offlineBatches.filter((batch) => !selectedBranchId || batch.branchId === selectedBranchId),
    [offlineBatches, selectedBranchId],
  );

  const selectedBatch = branchBatches.find((batch) => batch.id === selectedBatchId);

  const offlineBranches = useMemo(
    () =>
      Array.from(
        new Map(
          offlineBatches
            .filter((batch) => batch.branchId && batch.branch)
            .map((batch) => [batch.branchId, { id: batch.branchId, name: batch.branch!.name }]),
        ).values(),
      ),
    [offlineBatches],
  );

  useEffect(() => {
    if (!course || course.type !== 'OFFLINE' || !selectedBranchId) return;
    if (selectedBatchId && branchBatches.some((batch) => batch.id === selectedBatchId)) return;
    const firstAvailableBatch = branchBatches.find((batch) => batch.availableSeats !== 0);
    setSelectedBatchId(firstAvailableBatch?.id ?? '');
  }, [branchBatches, course?.type, selectedBatchId, selectedBranchId]);

  useEffect(() => {
    if (!courseId) return;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) return;
    let user: { id?: string };
    try {
      user = JSON.parse(userStr);
    } catch {
      return;
    }
    if (!user?.id) return;
    checkEnrollment(user.id, course.id)
      .then((r) => {
        if (r.success && r.data?.enrolled) setAlreadyEnrolled(true);
      })
      .catch(() => {});
  }, [courseId]);

  const redirectToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; max-age=0';
    }
    const redirectPath = `/course/${idOrSlug}`;
    window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  }, [idOrSlug]);

  const handleCheckoutOpenChange = useCallback(
    (open: boolean) => {
      if (open && !hasAuthToken()) {
        redirectToLogin();
        return;
      }
      setCheckoutOpen(open);
    },
    [redirectToLogin],
  );

  const courseBooks: CourseDetailCourseBook[] = useMemo(
    () => course?.courseBooks || [],
    [course?.courseBooks],
  );

  const selectedPaidBooks = useMemo(
    () => courseBooks.filter((cb) => !cb.isFree && selectedPaidBookIds.includes(cb.bookId)),
    [courseBooks, selectedPaidBookIds],
  );

  const booksAddonTotal = useMemo(() => {
    let total = 0;
    for (const cb of courseBooks) {
      if (cb.isFree) continue;
      if (!selectedPaidBookIds.includes(cb.bookId)) continue;
      total += Number(cb.book.price);
    }
    return total;
  }, [courseBooks, selectedPaidBookIds]);

  const needsDelivery = useMemo(
    () =>
      courseBooks.some(
        (cb) => !cb.isFree && selectedPaidBookIds.includes(cb.bookId) && !cb.book.isEbook,
      ),
    [courseBooks, selectedPaidBookIds],
  );

  const effectiveCourseFee = course ? Number(course.offerPrice ?? course.fee) : 0;
  const enrollTotal = effectiveCourseFee + booksAddonTotal;
  const checkoutCourseFee = checkoutQuote?.courseFee ?? effectiveCourseFee;
  const checkoutBooksTotal = checkoutQuote?.booksTotal ?? booksAddonTotal;
  const checkoutAdmissionFee = checkoutQuote?.admissionFee ?? 0;
  const checkoutTotal = checkoutQuote?.payableTotal ?? enrollTotal;

  const togglePaidBook = useCallback((bookId: string) => {
    setSelectedPaidBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId],
    );
  }, []);

  const setPaidBookIncluded = useCallback((bookId: string, included: boolean) => {
    setSelectedPaidBookIds((prev) => {
      if (included) return prev.includes(bookId) ? prev : [...prev, bookId];
      return prev.filter((id) => id !== bookId);
    });
  }, []);

  const startSelfCheckoutPayment = useCallback(
    async (deliveryPayload?: EnrollCourseDelivery) => {
      if (!course) return;
      if (!hasAuthToken()) {
        redirectToLogin();
        return;
      }

      setEnrolling(true);
      try {
        const orderRes = await createSelfCheckoutOrder({
          courseId: course.id,
          branchId: course.type === 'OFFLINE' ? selectedBranchId : undefined,
          batchId: selectedBatchId || undefined,
          includeBookIds: selectedPaidBookIds.length ? selectedPaidBookIds : undefined,
          delivery: deliveryPayload,
        });
        if (!orderRes.success || !orderRes.data?.id) {
          throw new Error(orderRes.message || 'Failed to create checkout order');
        }
        const payRes = await initSelfCheckoutPayment(orderRes.data.id);
        if (!payRes.success || !payRes.data?.GatewayPageURL) {
          throw new Error('Failed to initiate payment');
        }
        window.location.href = payRes.data.GatewayPageURL;
      } catch (e: unknown) {
        const err = e as ApiErrorWithResponse;
        const apiRes = err.response;
        const msg = resolveStudentOnlyMessage(
          err,
          STUDENT_ONLY_COURSE_PURCHASE_MESSAGE,
          apiRes?.message || err.message || 'Enrollment failed',
        );
        if (msg.includes('Already enrolled') || apiRes?.data?.enrollmentId) {
          setAlreadyEnrolled(true);
          toast({
            title: 'ইতিমধ্যে ভর্তি',
            description: msg,
            variant: 'success',
          });
        } else if (isAuthApiError(err)) {
          redirectToLogin();
        } else if (isStudentOnlyRestriction(err)) {
          toast({
            title: 'Cannot enroll',
            description: STUDENT_ONLY_COURSE_PURCHASE_MESSAGE,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'পেমেন্ট শুরু করা যায়নি',
            description: msg || 'আবার চেষ্টা করুন।',
            variant: 'destructive',
          });
        }
      } finally {
        setEnrolling(false);
      }
    },
    [
      course,
      redirectToLogin,
      selectedBatchId,
      selectedBranchId,
      selectedPaidBookIds,
      toast,
    ],
  );

  const handleEnrollClick = useCallback(() => {
    if (!course) return;
    if (!hasAuthToken()) {
      redirectToLogin();
      return;
    }
    if (isLoggedInNonStudent()) {
      toast({
        title: 'Cannot enroll',
        description: STUDENT_ONLY_COURSE_PURCHASE_MESSAGE,
        variant: 'destructive',
      });
      return;
    }
    if (course.type === 'OFFLINE' && selectedBatchId && !selectedBranchId) {
      const preselectedBatch = offlineBatches.find((batch) => batch.id === selectedBatchId);
      if (preselectedBatch?.branchId) setSelectedBranchId(preselectedBatch.branchId);
    }
    setCheckoutQuote(null);
    setQuoteError(null);
    setQuoteLoading(true);
    setCheckoutOpen(true);
  }, [course, offlineBatches, redirectToLogin, selectedBatchId, selectedBranchId]);

  const loadCheckoutBranch = useCallback(async () => {
    if (!course || course.type !== 'OFFLINE') return;
    setBranchProfileLoading(true);
    try {
      const profileRes = await getMyStudentProfile();
      if (!profileRes.success || !profileRes.data) {
        throw new Error(profileRes.message || 'Student profile not found');
      }
      const profileBranch = profileRes.data?.user?.branchId
        ? {
            id: profileRes.data.user.branchId,
            name: profileRes.data.user.branch?.name ?? 'Saved branch',
          }
        : null;
      setSavedBranch(profileBranch);
      if (profileBranch) {
        setSelectedBranchId(profileBranch.id);
        setSelectedBatchId('');
      }
    } catch {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!userStr) return;
      try {
        const user = JSON.parse(userStr) as { branchId?: string };
        if (user.branchId) {
          const localBranch = offlineBranches.find((branch) => branch.id === user.branchId);
          setSavedBranch(localBranch ?? { id: user.branchId, name: 'Saved branch' });
          setSelectedBranchId(user.branchId);
          setSelectedBatchId('');
        }
      } catch {
        // Keep checkout usable when local cache is malformed.
      }
    } finally {
      setBranchProfileLoading(false);
    }
  }, [course, offlineBranches]);

  useEffect(() => {
    if (!checkoutOpen || !course || course.type !== 'OFFLINE') return;
    void loadCheckoutBranch();
  }, [checkoutOpen, course, loadCheckoutBranch]);

  useEffect(() => {
    if (!checkoutOpen || !courseId) return;

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);
    getEnrollCourseQuote({
      courseId,
      includeBookIds: selectedPaidBookIds.length ? selectedPaidBookIds : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        if (!res.success || !res.data) {
          throw new Error(res.message || 'মূল্য যাচাই করা যায়নি।');
        }
        setCheckoutQuote(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isAuthApiError(err)) {
          setCheckoutOpen(false);
          redirectToLogin();
          return;
        }
        setCheckoutQuote(null);
        setQuoteError(
          resolveStudentOnlyMessage(err, STUDENT_ONLY_COURSE_PURCHASE_MESSAGE, 'Unable to verify pricing. Please try again.'),
        );
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [checkoutOpen, courseId, redirectToLogin, selectedPaidBookIds]);

  const submitDeliveryAndEnroll = useCallback(() => {
    if (!course) return;
    if (course.type === 'OFFLINE' && !selectedBranchId) {
      toast({
        title: 'Branch নির্বাচন করুন',
        description: 'অফলাইন কোর্সে ভর্তি হতে আগে একটি branch বেছে নিন।',
        variant: 'destructive',
      });
      return;
    }
    if (course.type === 'OFFLINE' && !selectedBatchId) {
      toast({
        title: 'Batch নির্বাচন করুন',
        description: 'অফলাইন কোর্সে ভর্তি হতে একটি active batch বেছে নিন।',
        variant: 'destructive',
      });
      return;
    }
    const payload: EnrollCourseDelivery = {
      recipientName: delivery.recipientName.trim(),
      phone: delivery.phone.trim(),
      address: delivery.address.trim(),
      city: delivery.city.trim() || undefined,
      postalCode: delivery.postalCode.trim() || undefined,
      notes: delivery.notes.trim() || undefined,
    };
    if (needsDelivery && (!payload.recipientName || !payload.phone || !payload.address)) {
      toast({
        title: 'তথ্য দিন',
        description: 'নাম, মোবাইল ও ঠিকানা পূরণ করুন।',
        variant: 'destructive',
      });
      return;
    }
    void startSelfCheckoutPayment(needsDelivery ? payload : undefined);
  }, [
    course,
    delivery,
    needsDelivery,
    selectedBatchId,
    selectedBranchId,
    startSelfCheckoutPayment,
    toast,
  ]);

  return {
    alreadyEnrolled,
    enrolling,
    selectedPaidBookIds,
    checkoutOpen,
    setCheckoutOpen: handleCheckoutOpenChange,
    delivery,
    setDelivery,
    offlineBatches,
    selectedBranchId,
    setSelectedBranchId,
    selectedBatchId,
    setSelectedBatchId,
    savedBranch,
    branchProfileLoading,
    checkoutQuote,
    quoteLoading,
    quoteError,
    branchBatches,
    selectedBatch,
    offlineBranches,
    courseBooks,
    selectedPaidBooks,
    booksAddonTotal,
    needsDelivery,
    effectiveCourseFee,
    enrollTotal,
    checkoutCourseFee,
    checkoutBooksTotal,
    checkoutAdmissionFee,
    checkoutTotal,
    togglePaidBook,
    setPaidBookIncluded,
    handleEnrollClick,
    submitDeliveryAndEnroll,
  };
}
