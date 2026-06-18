'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getCourseById } from '@/lib/api/courses';
import {
    checkEnrollment,
    createSelfCheckoutOrder,
    getEnrollCourseQuote,
    type EnrollCourseDelivery,
    type EnrollCourseQuote,
} from '@/lib/api/student-portal';
import { initSelfCheckoutPayment } from '@/lib/api/payment-gateway';
import { getMyStudentProfile } from '@/lib/api/student-profiles';
import { useCourseInitialData } from '@/components/course/CourseInitialDataContext';
import {
    type CourseDetailCourseBook,
    type CourseDetailBatch,
    type CourseDetails,
    DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS,
    normalizeCoursePublicPageDisplay,
    normalizeCourseSidebarFeatures,
    normalizeCourseWebsiteSections,
} from '@/types/course';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseHero } from './_components/CourseHero';
import { CourseBenefits } from './_components/CourseBenefits';
import { CourseWebsiteSections } from './_components/CourseWebsiteSections';
import { CourseTeachers } from './_components/CourseTeachers';
import { CourseBooks } from './_components/CourseBooks';
import { CourseSidebar } from './_components/CourseSidebar';
import { CheckoutDialog } from './_components/CheckoutDialog';

/** Marketing page: catalog-hidden courses are blocked for anonymous users at the API; extra guard if response is ever inconsistent. */
function shouldBlockCatalogHiddenCourse(data: { websiteVisible?: boolean } | null): boolean {
  if (!data || data.websiteVisible !== false) return false;
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('auth_token');
}

type ApiErrorWithResponse = Error & {
    response?: { message?: string; data?: { enrollmentId?: string } };
};

export default function CourseDetailsPageClient() {
    const { idOrSlug } = useParams();
    const { toast, toasts, removeToast } = useToast();
    const initialCourse = useCourseInitialData();
    const [course, setCourse] = useState<CourseDetails | null>(initialCourse);
    const [loading, setLoading] = useState(!initialCourse);
    const [error, setError] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
    const [selectedPaidBookIds, setSelectedPaidBookIds] = useState<string[]>([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [delivery, setDelivery] = useState({
        recipientName: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        notes: '',
    });
    // Batch selection for OFFLINE courses
    const [offlineBatches, setOfflineBatches] = useState<CourseDetailBatch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [savedBranch, setSavedBranch] = useState<{ id: string; name: string } | null>(null);
    const [branchProfileLoading, setBranchProfileLoading] = useState(false);
    const [checkoutQuote, setCheckoutQuote] = useState<EnrollCourseQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    const fetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getCourseById(idOrSlug as string);
            if (res.success && res.data) {
                const raw = res.data as unknown as CourseDetails;
                if (shouldBlockCatalogHiddenCourse(raw)) {
                    setCourse(null);
                    setError('This course is not available on the website.');
                    return;
                }
                setCourse(raw);
            } else {
                setError(res.message || 'Course not found');
            }
        } catch (err) {
            console.error('Error fetching course:', err);
            setError('Failed to load course details');
        } finally {
            setLoading(false);
        }
    }, [idOrSlug]);

    useEffect(() => {
        if (idOrSlug) {
            if (initialCourse) return;
            fetchCourse();
        }
    }, [idOrSlug, fetchCourse, initialCourse]);

    useEffect(() => {
        if (course?.type !== 'OFFLINE') {
            setOfflineBatches([]);
            return;
        }
        setOfflineBatches(
            (course.batches ?? []).filter((batch) => batch.status === 'ACTIVE')
        );
    }, [course]);

    const branchBatches = useMemo(
        () => offlineBatches.filter((batch) => !selectedBranchId || batch.branchId === selectedBranchId),
        [offlineBatches, selectedBranchId]
    );
    const selectedBatch = branchBatches.find((batch) => batch.id === selectedBatchId);
    const offlineBranches = useMemo(
        () =>
            Array.from(
                new Map(
                    offlineBatches
                        .filter((batch) => batch.branchId && batch.branch)
                        .map((batch) => [batch.branchId, { id: batch.branchId, name: batch.branch!.name }])
                ).values()
            ),
        [offlineBatches]
    );

    useEffect(() => {
        if (course?.type !== 'OFFLINE' || !selectedBranchId) return;
        if (selectedBatchId && branchBatches.some((batch) => batch.id === selectedBatchId)) return;
        const firstAvailableBatch = branchBatches.find(
            (batch) => batch.availableSeats !== 0
        );
        setSelectedBatchId(firstAvailableBatch?.id ?? '');
    }, [branchBatches, course?.type, selectedBatchId, selectedBranchId]);

    useEffect(() => {
        if (!course?.id) return;
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (!userStr) return;
        let user: { id?: string };
        try {
            user = JSON.parse(userStr);
        } catch {
            return;
        }
        if (!user?.id) return;
        checkEnrollment(user.id, course.id).then((r) => {
            if (r.success && r.data?.enrolled) setAlreadyEnrolled(true);
        }).catch(() => {});
    }, [course?.id]);

    const redirectToLogin = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('auth_token');
        }
        window.location.href = `/login?redirect=/course/${idOrSlug}`;
    };

    const courseBooks: CourseDetailCourseBook[] = useMemo(() => course?.courseBooks || [], [course?.courseBooks]);
    const selectedPaidBooks = useMemo(
        () => courseBooks.filter((cb) => !cb.isFree && selectedPaidBookIds.includes(cb.bookId)),
        [courseBooks, selectedPaidBookIds]
    );

    const booksAddonTotal = useMemo(() => {
        let s = 0;
        for (const cb of courseBooks) {
            if (cb.isFree) continue;
            if (!selectedPaidBookIds.includes(cb.bookId)) continue;
            s += Number(cb.book.price);
        }
        return s;
    }, [courseBooks, selectedPaidBookIds]);

    const needsDelivery = useMemo(() => {
        return courseBooks.some(
            (cb) =>
                !cb.isFree &&
                selectedPaidBookIds.includes(cb.bookId) &&
                !cb.book.isEbook
        );
    }, [courseBooks, selectedPaidBookIds]);

    const effectiveCourseFee = course ? Number(course.offerPrice ?? course.fee) : 0;
    const enrollTotal = effectiveCourseFee + booksAddonTotal;
    const checkoutCourseFee = checkoutQuote?.courseFee ?? effectiveCourseFee;
    const checkoutBooksTotal = checkoutQuote?.booksTotal ?? booksAddonTotal;
    const checkoutAdmissionFee = checkoutQuote?.admissionFee ?? 0;
    const checkoutTotal = checkoutQuote?.payableTotal ?? enrollTotal;

    const togglePaidBook = (bookId: string) => {
        setSelectedPaidBookIds((prev) =>
            prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
        );
    };
    const setPaidBookIncluded = (bookId: string, included: boolean) => {
        setSelectedPaidBookIds((prev) => {
            if (included) return prev.includes(bookId) ? prev : [...prev, bookId];
            return prev.filter((id) => id !== bookId);
        });
    };

    const startSelfCheckoutPayment = async (deliveryPayload?: EnrollCourseDelivery) => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (!userStr) {
            redirectToLogin();
            return;
        }
        if (!course) return;
        let user: { id?: string };
        try {
            user = JSON.parse(userStr);
        } catch {
            redirectToLogin();
            return;
        }
        if (!user?.id) {
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
            const msg = apiRes?.message || err.message || 'Enrollment failed';
            if (msg.includes('Already enrolled') || apiRes?.data?.enrollmentId) {
                setAlreadyEnrolled(true);
                toast({
                    title: 'ইতিমধ্যে ভর্তি',
                    description: msg,
                    variant: 'success',
                });
            } else if (
                msg.includes('Authentication required') ||
                msg.includes('User not found') ||
                msg.includes('Please log in') ||
                msg.includes('log in again')
            ) {
                redirectToLogin();
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
    };

    const handleEnrollClick = () => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (!userStr) {
            redirectToLogin();
            return;
        }
        if (!course) return;
        if (course.type === 'OFFLINE' && selectedBatchId && !selectedBranchId) {
            const preselectedBatch = offlineBatches.find((batch) => batch.id === selectedBatchId);
            if (preselectedBatch?.branchId) setSelectedBranchId(preselectedBatch.branchId);
        }
        setCheckoutQuote(null);
        setQuoteError(null);
        setQuoteLoading(true);
        setCheckoutOpen(true);
    };

    const loadCheckoutBranch = useCallback(async () => {
        if (course?.type !== 'OFFLINE') return;
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
    }, [course?.type, offlineBranches]);

    useEffect(() => {
        if (!checkoutOpen || course?.type !== 'OFFLINE') return;
        void loadCheckoutBranch();
    }, [checkoutOpen, course?.type, loadCheckoutBranch]);

    useEffect(() => {
        if (!checkoutOpen || !course?.id) return;

        let cancelled = false;
        setQuoteLoading(true);
        setQuoteError(null);
        getEnrollCourseQuote({
            courseId: course.id,
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
                setCheckoutQuote(null);
                setQuoteError(err instanceof Error ? err.message : 'মূল্য যাচাই করা যায়নি।');
            })
            .finally(() => {
                if (!cancelled) setQuoteLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [checkoutOpen, course?.id, selectedPaidBookIds]);

    const submitDeliveryAndEnroll = () => {
        if (course?.type === 'OFFLINE' && !selectedBranchId) {
            toast({
                title: 'Branch নির্বাচন করুন',
                description: 'অফলাইন কোর্সে ভর্তি হতে আগে একটি branch বেছে নিন।',
                variant: 'destructive',
            });
            return;
        }
        if (course?.type === 'OFFLINE' && !selectedBatchId) {
            toast({
                title: 'Batch নির্বাচন করুন',
                description: 'অফলাইন কোর্সে ভর্তি হতে একটি active batch বেছে নিন।',
                variant: 'destructive',
            });
            return;
        }
        const d: EnrollCourseDelivery = {
            recipientName: delivery.recipientName.trim(),
            phone: delivery.phone.trim(),
            address: delivery.address.trim(),
            city: delivery.city.trim() || undefined,
            postalCode: delivery.postalCode.trim() || undefined,
            notes: delivery.notes.trim() || undefined,
        };
        if (needsDelivery && (!d.recipientName || !d.phone || !d.address)) {
            toast({
                title: 'তথ্য দিন',
                description: 'নাম, মোবাইল ও ঠিকানা পূরণ করুন।',
                variant: 'destructive',
            });
            return;
        }
        void startSelfCheckoutPayment(needsDelivery ? d : undefined);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="pt-40 pb-20 flex flex-col items-center justify-center">
                    <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse">কোর্স লোড হচ্ছে...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-50 text-red-500 mb-6">
                        <Info size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4">দুঃখিত!</h1>
                    <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">{error || 'কোর্সটি খুঁজে পাওয়া যায়নি।'}</p>
                    <a href="/courses" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700">
                        সকল কোর্স দেখুন
                    </a>
                </div>
                <Footer />
            </div>
        );
    }

    const outline = course.outline as Record<string, unknown> | null | undefined;
    const publicPage = normalizeCoursePublicPageDisplay(course.outline);

    const rawBenefits = outline?.benefits;
    const benefitsList =
        Array.isArray(rawBenefits)
            ? rawBenefits
                  .map((b: unknown) => (typeof b === 'string' ? b.trim() : ''))
                  .filter(Boolean)
            : null;
    const benefits =
        benefitsList === null ? [...DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS] : benefitsList;

    const websiteSectionsAll = normalizeCourseWebsiteSections(outline?.websiteSections);
    const websiteSections = publicPage.showWebsiteSections ? websiteSectionsAll : [];

    const sidebarFeaturesCustom = normalizeCourseSidebarFeatures(outline?.sidebarFeatures);
    const sidebarCardTitle =
        typeof outline?.sidebarTitle === 'string' && outline.sidebarTitle.trim()
            ? outline.sidebarTitle.trim()
            : 'কোর্স ফিচারসমূহ';

    const heroHeading =
        typeof outline?.heroTitle === 'string' && outline.heroTitle.trim()
            ? outline.heroTitle.trim()
            : course.name;
    const benefitsSectionTitle =
        typeof outline?.whyTakeTitle === 'string' && outline.whyTakeTitle.trim()
            ? outline.whyTakeTitle.trim()
            : 'কোর্সটি কেন করবেন?';
    const booksSectionTitle =
        typeof outline?.booksSectionTitle === 'string' && outline.booksSectionTitle.trim()
            ? outline.booksSectionTitle.trim()
            : 'সুপারিশকৃত বই';
    const booksSectionSubtitle =
        typeof outline?.booksSectionSubtitle === 'string' && outline.booksSectionSubtitle.trim()
            ? outline.booksSectionSubtitle.trim()
            : '';
    const teachersSectionTitle =
        typeof outline?.teachersSectionTitle === 'string' && outline.teachersSectionTitle.trim()
            ? outline.teachersSectionTitle.trim()
            : 'কোর্সের শিক্ষক';
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
            <Toaster toasts={toasts} removeToast={removeToast} />
            <Header />

            <CourseHero course={course} heroHeading={heroHeading} />

            {/* Course Content */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
                <div className={cn('grid gap-16', publicPage.showSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-1')}>
                    {/* Main Info */}
                    <div className={cn('space-y-16', publicPage.showSidebar ? 'lg:col-span-2' : '')}>
                        {publicPage.showBenefits ? (
                            <CourseBenefits benefits={benefits} title={benefitsSectionTitle} />
                        ) : null}

                        <CourseWebsiteSections sections={websiteSections} />

                        {publicPage.showTeachers && course.teachers && course.teachers.length > 0 ? (
                            <CourseTeachers teachers={course.teachers} title={teachersSectionTitle} />
                        ) : null}

                        {publicPage.showBooks && courseBooks.length > 0 ? (
                            <CourseBooks
                                courseBooks={courseBooks}
                                selectedPaidBookIds={selectedPaidBookIds}
                                togglePaidBook={togglePaidBook}
                                title={booksSectionTitle}
                                subtitle={booksSectionSubtitle}
                            />
                        ) : null}
                    </div>

                    {publicPage.showSidebar ? (
                        <CourseSidebar
                            course={course}
                            sidebarFeaturesCustom={sidebarFeaturesCustom}
                            sidebarCardTitle={sidebarCardTitle}
                            enrollTotal={enrollTotal}
                            effectiveCourseFee={effectiveCourseFee}
                            booksAddonTotal={booksAddonTotal}
                            offlineBatches={offlineBatches}
                            selectedBatchId={selectedBatchId}
                            setSelectedBatchId={setSelectedBatchId}
                            alreadyEnrolled={alreadyEnrolled}
                            enrolling={enrolling}
                            handleEnrollClick={handleEnrollClick}
                            loading={loading}
                        />
                    ) : null}
                </div>
            </div>

            <CheckoutDialog
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                course={course}
                checkoutCourseFee={checkoutCourseFee}
                checkoutBooksTotal={checkoutBooksTotal}
                checkoutAdmissionFee={checkoutAdmissionFee}
                checkoutTotal={checkoutTotal}
                checkoutBillingType={checkoutQuote?.billingType}
                checkoutBillingMonth={checkoutQuote?.billingMonth}
                courseBooks={courseBooks}
                selectedPaidBooks={selectedPaidBooks}
                selectedPaidBookIds={selectedPaidBookIds}
                setPaidBookIncluded={setPaidBookIncluded}
                offlineBatches={offlineBatches}
                offlineBranches={offlineBranches}
                lockedBranch={savedBranch}
                branchLocked={Boolean(savedBranch)}
                selectedBranchId={selectedBranchId}
                setSelectedBranchId={(branchId) => {
                    setSelectedBranchId(branchId);
                    setSelectedBatchId('');
                }}
                batchesLoading={branchProfileLoading}
                selectedBatchId={selectedBatchId}
                setSelectedBatchId={setSelectedBatchId}
                selectedBatch={selectedBatch}
                needsDelivery={needsDelivery}
                delivery={delivery}
                setDelivery={setDelivery}
                enrolling={enrolling}
                quoteLoading={quoteLoading}
                quoteError={quoteError}
                submitDeliveryAndEnroll={submitDeliveryAndEnroll}
            />

            <Footer />
        </div>
    );
}
