'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getCourseById } from '@/lib/api/courses';
import { enrollInCourse, checkEnrollment, type EnrollCourseDelivery } from '@/lib/api/student-portal';
import { getInvoicePdfUrl, initInvoicePayment } from '@/lib/api/invoices';
import { getBatches, type Batch } from '@/lib/api/batches';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { useCourseInitialData } from '@/components/course/CourseInitialDataContext';
import Image from 'next/image';
import {
    type CourseDetailCourseBook,
    type CourseDetails,
    DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS,
    normalizeCoursePublicPageDisplay,
    normalizeCourseSidebarFeatures,
    normalizeCourseWebsiteSections,
} from '@/types/course';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BookOpen,
    CheckCircle2,
    ArrowRight,
    Info,
    Layout,
    Globe,
    Zap,
    FileText,
    Receipt,
    Download,
    UserCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Marketing page: catalog-hidden courses are blocked for anonymous users at the API; extra guard if response is ever inconsistent. */
function shouldBlockCatalogHiddenCourse(data: { websiteVisible?: boolean } | null): boolean {
  if (!data || data.websiteVisible !== false) return false;
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('auth_token');
}

type ApiErrorWithResponse = Error & {
    response?: { message?: string; data?: { enrollmentId?: string } };
};

type BatchWithSeats = Batch & { availableSeats?: number | null };

export default function CourseDetailsPage() {
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
    const [createdInvoice, setCreatedInvoice] = useState<{
        id: string;
        total?: number;
        quote?: {
            courseFee: number;
            booksTotal: number;
            admissionFee: number;
            payableTotal: number;
            currency: string;
        };
    } | null>(null);
    // Batch selection for OFFLINE courses
    const [offlineBatches, setOfflineBatches] = useState<Batch[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');

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

    // Fetch batches for OFFLINE courses
    useEffect(() => {
        if (!course?.id || course.type !== 'OFFLINE') return;
        getBatches({ courseId: course.id, status: 'ACTIVE', limit: 50 }).then((res) => {
            if (res.success && res.data) setOfflineBatches(res.data);
        }).catch(() => {});
    }, [course?.id, course?.type]);

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
        if (!course) return false;
        if (course.type === 'OFFLINE') return true;
        return courseBooks.some(
            (cb) =>
                !cb.isFree &&
                selectedPaidBookIds.includes(cb.bookId) &&
                !cb.book.isEbook
        );
    }, [course, courseBooks, selectedPaidBookIds]);

    const effectiveCourseFee = course ? Number(course.offerPrice ?? course.fee) : 0;
    const estimatedAdmissionFee =
        course?.program?.admissionFeeEnabled && course.program.admissionFeeAmount
            ? Number(course.program.admissionFeeAmount)
            : 0;
    const enrollTotal = effectiveCourseFee + booksAddonTotal + estimatedAdmissionFee;
    const invoiceQuote = createdInvoice?.quote;
    const checkoutCourseFee = invoiceQuote?.courseFee ?? effectiveCourseFee;
    const checkoutBooksTotal = invoiceQuote?.booksTotal ?? booksAddonTotal;
    const checkoutAdmissionFee = invoiceQuote?.admissionFee ?? estimatedAdmissionFee;
    const checkoutTotal = createdInvoice?.total ?? invoiceQuote?.payableTotal ?? enrollTotal;

    const togglePaidBook = (bookId: string) => {
        setSelectedPaidBookIds((prev) =>
            prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
        );
    };

    const performEnroll = async (deliveryPayload?: EnrollCourseDelivery) => {
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
            const res = await enrollInCourse({
                courseId: course.id,
                batchId: selectedBatchId || undefined,
                includeBookIds: selectedPaidBookIds.length ? selectedPaidBookIds : undefined,
                delivery: deliveryPayload,
            });
            if (!res.success || !res.data?.invoice?.id) {
                throw new Error((res as { message?: string }).message || 'Failed to enroll');
            }
            const inv = res.data.invoice as { id: string; totalAmount?: unknown; payableAmount?: unknown };
            const quote = res.data.quote;
            const total =
                Number(quote?.payableTotal ?? inv.payableAmount ?? inv.totalAmount ?? enrollTotal) || enrollTotal;
            setCreatedInvoice({ id: inv.id, total, quote });
            toast({
                title: 'ইনভয়েস তৈরি হয়েছে',
                description: 'পেমেন্ট সম্পন্ন হলে কোর্স অ্যাক্সেস চালু হবে।',
                variant: 'success',
            });
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
                    title: 'ভর্তি ব্যর্থ',
                    description: msg,
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
        setCreatedInvoice(null);
        setCheckoutOpen(true);
    };

    const submitDeliveryAndEnroll = () => {
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
        void performEnroll(needsDelivery ? d : undefined);
    };

    const openInvoicePdf = async () => {
        if (!createdInvoice?.id) return;
        try {
            const res = await getInvoicePdfUrl(createdInvoice.id);
            if (!res.success || !res.data?.pdfUrl) throw new Error(res.message || 'No PDF');
            const path = res.data.pdfUrl.startsWith('http')
                ? res.data.pdfUrl
                : `${API_ORIGIN}${res.data.pdfUrl.startsWith('/') ? '' : '/'}${res.data.pdfUrl}`;
            const fr = await fetch(path, { credentials: 'include' });
            if (!fr.ok) throw new Error('PDF download failed');
            const blob = await fr.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            toast({
                title: 'PDF',
                description: err instanceof Error ? err.message : 'Could not open PDF',
                variant: 'destructive',
            });
        }
    };

    const payInvoiceNow = async () => {
        if (!createdInvoice?.id) return;
        try {
            const payRes = await initInvoicePayment(createdInvoice.id);
            if (payRes.success && payRes.data?.GatewayPageURL) {
                window.location.href = payRes.data.GatewayPageURL;
            } else {
                throw new Error('Failed to initiate payment');
            }
        } catch (e: unknown) {
            const err = e as Error;
            toast({
                title: 'পেমেন্ট',
                description: err.message || 'গেটওয়ে খুলতে ব্যর্থ',
                variant: 'destructive',
            });
        }
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
    const selectedBatch = offlineBatches.find((batch) => batch.id === selectedBatchId);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
            <Toaster toasts={toasts} removeToast={removeToast} />
            <Header />

            {/* Hero Section */}
            <div className="relative bg-[#0F172A] pt-28 pb-16 md:pb-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <div className="flex items-center flex-wrap gap-3 mb-6">
                            <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                {course.program?.name || 'Academic'}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                {course.type === 'ONLINE' ? '• Online Course' : '• Offline Course'}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
                            {heroHeading}
                        </h1>
                        <div
                            className="text-slate-400 text-base md:text-lg font-medium mb-10 max-w-xl leading-relaxed prose prose-invert"
                            dangerouslySetInnerHTML={{ __html: course.description || 'আপনার স্বপ্ন পূরণের যাত্রায় আমরা আছি আপনার পাশে।' }}
                        />
                    </motion.div>
                    {course.thumbnail ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="hidden md:block">
                            <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
                                <Image
                                    src={resolveAttachmentUrl(course.thumbnail, API_ORIGIN)}
                                    alt={course.name}
                                    fill
                                    className="object-cover"
                                    sizes="50vw"
                                />
                            </div>
                        </motion.div>
                    ) : null}
                </div>
            </div>

      
            {/* Course Content Sections */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
                <div className={cn('grid gap-16', publicPage.showSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-1')}>
                    {/* Main Info */}
                    <div className={cn('space-y-16', publicPage.showSidebar ? 'lg:col-span-2' : '')}>
                        {/* Why this course */}
                     {publicPage.showBenefits ? (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <Zap size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{benefitsSectionTitle}</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {benefits.map((benefit: string, idx: number) => (
                                        <div
                                            key={`${benefit.slice(0, 24)}-${idx}`}
                                            className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-4 transition-all hover:border-indigo-100 group"
                                        >
                                            <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <p className="font-bold text-slate-700 leading-relaxed">{benefit}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {websiteSections.length > 0
                            ? websiteSections.map((sec) => (
                                <section key={sec.id} className="space-y-6">
                                    {sec.title.trim() ? (
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                                                <Layout size={24} />
                                            </div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{sec.title}</h2>
                                        </div>
                                    ) : null}
                                    {sec.bodyHtml?.trim() ? (
                                        <div
                                            className={cn(
                                                'prose prose-slate prose-lg max-w-none bg-white p-8 rounded-3xl border border-slate-100',
                                                '[&_img]:rounded-xl [&_img]:border [&_img]:border-slate-100'
                                            )}
                                            dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
                                        />
                                    ) : null}
                                </section>
                              ))
                            : null}

                        {/* Teachers */}
                        {publicPage.showTeachers && course.teachers && course.teachers.length > 0 ? (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <UserCircle size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{teachersSectionTitle}</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {course.teachers.map((ct) => {
                                        const t = ct.teacher;
                                        if (!t) return null;
                                        const imgSrc = t.profileImage ? resolveAttachmentUrl(t.profileImage, API_ORIGIN) : null;
                                        return (
                                            <div key={ct.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col items-center text-center gap-3 hover:shadow-lg transition-all group">
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border-2 border-white shadow-md">
                                                    {imgSrc ? (
                                                        <Image src={imgSrc} alt={t.fullName} width={80} height={80} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <UserCircle className="text-slate-400 w-10 h-10" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base leading-tight">{t.fullName}</p>
                                                    {t.designation && <p className="text-xs font-bold text-indigo-600 mt-0.5">{t.designation}</p>}
                                                    {t.institute && <p className="text-xs font-medium text-slate-400 mt-0.5">{t.institute}</p>}
                                                    {t.experienceYears != null && (
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.experienceYears} বছরের অভিজ্ঞতা</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ) : null}

                        {publicPage.showBooks && courseBooks.length > 0 ? (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{booksSectionTitle}</h2>
                                        {booksSectionSubtitle ? (
                                            <p className="text-sm font-medium text-slate-500 mt-1">{booksSectionSubtitle}</p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {courseBooks.map((cb) => (
                                        <label
                                            key={cb.id}
                                            className={cn(
                                                'bg-white p-5 rounded-3xl border flex gap-4 items-center transition-colors cursor-pointer',
                                                cb.isFree
                                                    ? 'border-slate-100 hover:border-amber-100'
                                                    : selectedPaidBookIds.includes(cb.bookId)
                                                      ? 'border-amber-400 ring-1 ring-amber-200'
                                                      : 'border-slate-100 hover:border-amber-100'
                                            )}
                                        >
                                            {!cb.isFree ? (
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                                    checked={selectedPaidBookIds.includes(cb.bookId)}
                                                    onChange={() => togglePaidBook(cb.bookId)}
                                                />
                                            ) : (
                                                <span className="h-5 w-5 shrink-0 rounded border border-emerald-200 bg-emerald-50" />
                                            )}
                                            {cb.book.thumbnailUrl ? (
                                                <img
                                                    src={cb.book.thumbnailUrl}
                                                    alt=""
                                                    className="h-20 w-14 object-cover rounded-xl border border-slate-100"
                                                />
                                            ) : (
                                                <div className="h-20 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-black text-slate-900 truncate">{cb.book.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {cb.book.isEbook ? 'ই-বুক' : 'প্রিন্ট'}{' '}
                                                    {cb.isFree ? (
                                                        <span className="text-emerald-600">· বিনামূল্যে (কোর্সে)</span>
                                                    ) : (
                                                        <span className="text-amber-700">· ৳{Number(cb.book.price).toLocaleString()}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                  
                    </div>

                    {/* Sidebar */}
                    {publicPage.showSidebar ? (
                    <aside className="space-y-8">
                        {/* Course Features Card */}
                        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm sticky top-28">
                            <h3 className="text-xl font-black text-slate-900 mb-8 pb-4 border-b border-slate-50">{sidebarCardTitle}</h3>

                            {/* outline.sidebarFeatures → CourseFeature API → default copy */}
                            {sidebarFeaturesCustom.length > 0 ? (
                                <div className="space-y-5">
                                    {sidebarFeaturesCustom.map((f) => (
                                        <div key={f.id} className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 text-base font-black shrink-0">
                                                {f.icon || '✦'}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{f.label}</span>
                                                <span className="font-bold text-slate-700 text-sm truncate">{f.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : course.features && course.features.length > 0 ? (
                                <div className="space-y-5">
                                    {course.features.map((f) => (
                                        <div key={f.id} className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 text-base font-black shrink-0">
                                                {f.icon || '✦'}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{f.label}</span>
                                                <span className="font-bold text-slate-700 text-sm truncate">{f.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600">
                                            <Globe size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">কোর্স মোড</span>
                                            <span className="font-bold text-slate-700">{course.type === 'ONLINE' ? 'অনলাইন' : 'অফলাইন'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-600">
                                            <Layout size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">পেমেন্ট</span>
                                            <span className="font-bold text-slate-700">{course.type === 'ONLINE' ? 'এককালীন পেমেন্ট' : 'ভর্তির সময় নির্ধারিত'}</span>
                                        </div>
                                    </div>
                                    
                                </div>
                            )}

                            <div className="mt-10 pt-10 border-t border-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-slate-500 uppercase text-xs tracking-widest">মোট ফি</span>
                                    <span className="text-4xl font-black text-[#5C2D91]">৳{enrollTotal.toLocaleString()}</span>
                                </div>
                                {course.offerPrice != null && Number(course.offerPrice) < Number(course.fee) && (
                                    <p className="text-xs font-bold text-right mb-1">
                                        <span className="text-slate-400 line-through mr-2">৳{Number(course.fee).toLocaleString()}</span>
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                            🔥 {Math.round(((Number(course.fee) - Number(course.offerPrice)) / Number(course.fee)) * 100)}% OFF
                                        </span>
                                    </p>
                                )}
                                {booksAddonTotal > 0 ? (
                                    <p className="text-[10px] font-bold text-slate-400 mb-6 text-right uppercase tracking-wide">
                                        কোর্স ৳{effectiveCourseFee.toLocaleString()} + বই ৳{booksAddonTotal.toLocaleString()}
                                    </p>
                                ) : (
                                    <div className="mb-6" />
                                )}
                                {/* Batch selector for OFFLINE courses */}
                                {course.type === 'OFFLINE' && offlineBatches.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Batch নির্বাচন করুন</p>
                                        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-800">
                                                <SelectValue placeholder="Batch বেছে নিন" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {offlineBatches.map((b) => {
                                                    const seats = (b as BatchWithSeats).availableSeats;
                                                    const isFull = seats === 0;
                                                    return (
                                                        <SelectItem key={b.id} value={b.id} disabled={isFull} className="font-bold">
                                                            {b.name}
                                                            {seats != null ? (
                                                                <span className={cn('ml-2 text-[10px] font-black', isFull ? 'text-rose-500' : 'text-slate-400')}>
                                                                    {isFull ? '· পূর্ণ' : `· ${seats} seats`}
                                                                </span>
                                                            ) : null}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {course.type === 'OFFLINE' && offlineBatches.length === 0 && !loading && (
                                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                                        সব ব্যাচ পূর্ণ। নতুন ব্যাচ শীঘ্রই আসছে।
                                    </div>
                                )}
                                {alreadyEnrolled ? (
                                    <Link
                                        href="/student/courses"
                                        className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <CheckCircle2 size={20} /> কোর্সটি ভিজিট করুন।<ArrowRight size={20} />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handleEnrollClick}
                                        disabled={enrolling}
                                        className="w-full h-16 bg-[#5C2D91] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition-all hover:bg-[#4A2475] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                                    >
                                        {enrolling ? 'প্রসেসিং...' : 'এখনই ভর্তি হোন'} <ArrowRight size={20} />
                                    </button>
                                )}
                                <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">নিরাপদ পেমেন্ট গ্যারান্টি</p>
                            </div>
                        </div>

                     
                    </aside>
                    ) : null}
                </div>
            </div>

            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 p-0">
                    <DialogHeader>
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <DialogTitle className="truncate text-xl font-black text-slate-900">
                                        {createdInvoice ? 'ইনভয়েস তৈরি হয়েছে' : 'ভর্তি নিশ্চিত করুন'}
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 text-left text-sm font-medium text-slate-500">
                                        {createdInvoice
                                            ? 'পেমেন্ট সম্পন্ন হলে কোর্স অ্যাক্সেস চালু হবে।'
                                            : course.name}
                                    </DialogDescription>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
                                        {createdInvoice ? 'Invoice' : 'Checkout'}
                                    </span>
                                    <p className="mt-2 text-2xl font-black text-[#5C2D91]">
                                        ৳{checkoutTotal.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 px-6 py-5">
                        <div className="rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm">
                                <span className="font-bold text-slate-500">কোর্স ফি</span>
                                <span className="font-black text-slate-900">৳{checkoutCourseFee.toLocaleString()}</span>
                            </div>
                            {selectedPaidBooks.length > 0 ? (
                                <div className="border-b border-slate-100 px-4 py-3">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-500">নির্বাচিত বই</span>
                                        <span className="font-black text-slate-900">৳{checkoutBooksTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {selectedPaidBooks.map((cb) => (
                                            <div key={cb.bookId} className="flex items-center justify-between gap-3 text-xs text-slate-500">
                                                <span className="truncate">{cb.book.name}</span>
                                                <span className="font-bold">৳{Number(cb.book.price).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {checkoutAdmissionFee > 0 ? (
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm">
                                    <span className="font-bold text-slate-500">ভর্তি ফি</span>
                                    <span className="font-black text-slate-900">৳{checkoutAdmissionFee.toLocaleString()}</span>
                                </div>
                            ) : null}
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">মোট</span>
                                <span className="text-xl font-black text-[#5C2D91]">৳{checkoutTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {createdInvoice ? (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                                <div className="flex items-center gap-2 font-black">
                                    <Receipt className="h-4 w-4" />
                                    ইনভয়েস ID: <span className="font-mono text-xs">{createdInvoice.id}</span>
                                </div>
                                <p className="mt-2 font-medium">
                                    ইনভয়েস তৈরি হয়েছে। পেমেন্ট সম্পন্ন হলে কোর্স অ্যাক্সেস চালু হবে।
                                </p>
                            </div>
                        ) : (
                            <>
                                {course.type === 'OFFLINE' ? (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Batch নির্বাচন করুন</Label>
                                        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-800">
                                                <SelectValue placeholder="Batch বেছে নিন" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {offlineBatches.map((b) => {
                                                    const seats = (b as Batch & { availableSeats?: number | null }).availableSeats;
                                                    const isFull = seats === 0;
                                                    return (
                                                        <SelectItem key={b.id} value={b.id} disabled={isFull} className="font-bold">
                                                            {b.name}
                                                            {seats != null ? (
                                                                <span className={cn('ml-2 text-[10px] font-black', isFull ? 'text-rose-500' : 'text-slate-400')}>
                                                                    {isFull ? '· পূর্ণ' : `· ${seats} seats`}
                                                                </span>
                                                            ) : null}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {selectedBatch ? (
                                            <p className="text-xs font-bold text-emerald-700">{selectedBatch.name} নির্বাচিত হয়েছে।</p>
                                        ) : (
                                            <p className="text-xs font-bold text-amber-700">
                                                অফলাইন কোর্সে ভর্তি হতে একটি active batch নির্বাচন করুন।
                                            </p>
                                        )}
                                    </div>
                                ) : null}

                                {needsDelivery ? (
                                    <div className="space-y-3">
                                        <p className="text-sm font-bold text-slate-600">
                                            {course.type === 'OFFLINE'
                                                ? 'যোগাযোগ ও ঠিকানা দিন। প্রিন্ট বই থাকলে ডেলিভারির জন্যও ব্যবহৃত হবে।'
                                                : 'প্রিন্ট বইয়ের ডেলিভারির জন্য ঠিকানা দিন।'}
                                        </p>
                                        <div className="grid gap-3">
                                            <div>
                                                <Label className="text-xs font-bold">পূর্ণ নাম</Label>
                                                <Input
                                                    className="mt-1 rounded-xl"
                                                    value={delivery.recipientName}
                                                    onChange={(e) => setDelivery((d) => ({ ...d, recipientName: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold">মোবাইল</Label>
                                                <Input
                                                    className="mt-1 rounded-xl"
                                                    value={delivery.phone}
                                                    onChange={(e) => setDelivery((d) => ({ ...d, phone: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold">ঠিকানা</Label>
                                                <Input
                                                    className="mt-1 rounded-xl"
                                                    value={delivery.address}
                                                    onChange={(e) => setDelivery((d) => ({ ...d, address: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs font-bold">শহর (ঐচ্ছিক)</Label>
                                                    <Input
                                                        className="mt-1 rounded-xl"
                                                        value={delivery.city}
                                                        onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-bold">পোস্ট কোড</Label>
                                                    <Input
                                                        className="mt-1 rounded-xl"
                                                        value={delivery.postalCode}
                                                        onChange={(e) => setDelivery((d) => ({ ...d, postalCode: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2 border-t border-slate-100 px-6 py-4 sm:gap-2">
                        {createdInvoice ? (
                            <>
                                <Button type="button" variant="outline" className="gap-2" onClick={() => void openInvoicePdf()}>
                                    <Download className="h-4 w-4" />
                                    PDF দেখুন
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>
                                    পরে পেমেন্ট করব
                                </Button>
                                <Button type="button" className="gap-2 bg-[#5C2D91] hover:bg-[#4A2475]" onClick={() => void payInvoiceNow()}>
                                    পেমেন্ট করুন <ArrowRight className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>
                                    বাতিল
                                </Button>
                                <Button
                                    type="button"
                                    onClick={submitDeliveryAndEnroll}
                                    disabled={enrolling || (course.type === 'OFFLINE' && !selectedBatchId)}
                                    className="bg-[#5C2D91] hover:bg-[#4A2475]"
                                >
                                    {enrolling ? 'প্রসেসিং...' : 'ইনভয়েস তৈরি করুন'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
