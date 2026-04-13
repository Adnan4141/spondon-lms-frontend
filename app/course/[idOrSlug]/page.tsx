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
import {
    type CourseDetailCourseBook,
    type CourseDetails,
    curriculumContentTypeLabel,
    DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS,
    normalizeCoursePublicPageDisplay,
    normalizeCourseWebsiteSections,
} from '@/types/course';
import type { ContentType } from '@/types/course-content';
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
    ShieldCheck,
    Info,
    Layout,
    Globe,
    Zap,
    FileText,
    Receipt,
    Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CourseDetailsPage() {
    const { idOrSlug } = useParams();
    const { toast, toasts, removeToast } = useToast();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
    const [selectedPaidBookIds, setSelectedPaidBookIds] = useState<string[]>([]);
    const [deliveryOpen, setDeliveryOpen] = useState(false);
    const [delivery, setDelivery] = useState({
        recipientName: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        notes: '',
    });
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<{ id: string; total?: number } | null>(null);
    // Batch selection for OFFLINE courses
    const [offlineBatches, setOfflineBatches] = useState<Batch[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');

    const fetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getCourseById(idOrSlug as string);
            if (res.success && res.data) {
                setCourse(res.data as unknown as CourseDetails);
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
            fetchCourse();
        }
    }, [idOrSlug, fetchCourse]);

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

    const courseBooks: CourseDetailCourseBook[] = course?.courseBooks || [];

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
    const enrollTotal = effectiveCourseFee + booksAddonTotal;

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
                studentUserId: user.id,
                courseId: course.id,
                batchId: selectedBatchId || undefined,
                includeBookIds: selectedPaidBookIds.length ? selectedPaidBookIds : undefined,
                delivery: deliveryPayload,
            });
            if (!res.success || !res.data?.invoice?.id) {
                throw new Error((res as { message?: string }).message || 'Failed to enroll');
            }
            const inv = res.data.invoice as { id: string; totalAmount?: unknown; payableAmount?: unknown };
            const total =
                Number(inv.payableAmount ?? inv.totalAmount ?? enrollTotal) || enrollTotal;
            setDeliveryOpen(false);
            setCreatedInvoice({ id: inv.id, total });
            toast({
                title: 'ইনভয়েস তৈরি হয়েছে',
                description: 'পরের উইন্ডোতে ইনভয়েস দেখুন — PDF বা পেমেন্ট বেছে নিন।',
                variant: 'success',
            });
            window.setTimeout(() => {
                setInvoiceDialogOpen(true);
            }, 120);
        } catch (e: any) {
            const apiRes = e.response;
            const msg = apiRes?.message || e.message || 'Enrollment failed';
            if (msg.includes('Already enrolled') || apiRes?.data?.enrollmentId) {
                setAlreadyEnrolled(true);
                toast({
                    title: 'ইতিমধ্যে ভর্তি',
                    description: msg,
                    variant: 'success',
                });
            } else if (msg.includes('User not found') || msg.includes('Please log in') || msg.includes('log in again')) {
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
        if (needsDelivery) {
            setDeliveryOpen(true);
            return;
        }
        void performEnroll();
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
        if (!d.recipientName || !d.phone || !d.address) {
            toast({
                title: 'তথ্য দিন',
                description: 'নাম, মোবাইল ও ঠিকানা পূরণ করুন।',
                variant: 'destructive',
            });
            return;
        }
        void performEnroll(d);
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
        } catch (e: any) {
            toast({
                title: 'পেমেন্ট',
                description: e.message || 'গেটওয়ে খুলতে ব্যর্থ',
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

    const contents = course.contents ?? [];
    const curriculumTypeSet = new Set<ContentType>(publicPage.curriculumContentTypes);
    const curriculumRows = contents.filter((c) => curriculumTypeSet.has(c.type));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
            <Toaster toasts={toasts} removeToast={removeToast} />
            <Header />

            {/* Hero Section */}
            <div className="relative bg-[#0F172A] pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />

                <div className="max-w-7xl  flex items-center justify-center mx-auto px-6 lg:px-12 relative z-10">
                    <div className="gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center flex-wrap gap-3 mb-6">
                                <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                    {course.program?.name || 'Academic'}
                                </span>
                                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                    {course.type === 'ONLINE' ? '• Online Course' : '• Offline Course'}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
                                {course.name}
                            </h1>
                            <div 
                                className="text-slate-400 text-lg font-medium mb-10 max-w-xl leading-relaxed prose prose-invert"
                                dangerouslySetInnerHTML={{ __html: course.description || 'আপনার স্বপ্ন পূরণের যাত্রায় আমরা আছি আপনার পাশে। মানসম্মত শিক্ষা এবং সঠিক নির্দেশনায় গড়ে তুলুন আপনার ভবিষ্যৎ।' }}
                            />

                         

                        </motion.div>

                      
                    </div>
                </div>
            </div>

            {/* Course Content Sections */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
                <div className="grid lg:grid-cols-3 gap-16">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-16">
                        {/* Why this course */}
                        {publicPage.showBenefits ? (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <Zap size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">কোর্সটি কেন করবেন?</h2>
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

                        {publicPage.showBooks && courseBooks.length > 0 ? (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">সুপারিশকৃত বই</h2>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            পেইড বই টিক দিলে ভর্তির ইনভয়েসে যুক্ত হবে। বিনামূল্যে চিহ্নিত বই কোর্সের সাথে অন্তর্ভুক্ত।
                                        </p>
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

                        {/* Course content list (types chosen in admin) */}
                        {publicPage.showCurriculum ? (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                        <BookOpen size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">কোর্স কারিকুলাম</h2>
                                </div>
                                <div className="space-y-4">
                                    {curriculumRows.length > 0 ? (
                                        curriculumRows.map((item, idx: number) => {
                                            const meta =
                                                item.textBody?.trim() ||
                                                (item.type === 'VIDEO' && item.durationMinutes
                                                    ? `${item.durationMinutes} মিনিট`
                                                    : null);
                                            return (
                                                <div
                                                    key={item.id || idx}
                                                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all hover:shadow-md"
                                                >
                                                    <div className="p-6 flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-6 min-w-0">
                                                            <span className="h-10 w-10 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mb-1.5">
                                                                    {curriculumContentTypeLabel(item.type)}
                                                                </span>
                                                                <h4 className="font-black text-slate-800 mb-1 truncate">{item.title}</h4>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                    {meta || '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {item.fileUrl ? (
                                                                <a
                                                                    href={item.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors hover:bg-indigo-600 hover:text-white"
                                                                >
                                                                    <FileText size={14} />
                                                                </a>
                                                            ) : null}
                                                            <ArrowRight size={20} className="text-slate-300" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="bg-white p-12 rounded-[40px] border border-dashed border-slate-200 text-center">
                                            <p className="text-slate-400 font-bold">
                                                নির্বাচিত কনটেন্ট টাইপ অনুযায়ী এখনো কোনো আইটেম নেই। অ্যাডমিন থেকে টাইপ বা কনটেন্ট যোগ করুন।
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ) : null}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        {/* Course Features Card */}
                        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm sticky top-28">
                            <h3 className="text-xl font-black text-slate-900 mb-8 pb-4 border-b border-slate-50">কোর্স ফিচারসমূহ</h3>
                            
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
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-amber-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">সার্টিফিকেট</span>
                                        <span className="font-bold text-slate-700">কোর্স শেষে সার্টিফিকেট</span>
                                    </div>
                                </div>
                            </div>

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
                                                    const seats = (b as any).availableSeats;
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
                                        disabled={enrolling || (course.type === 'OFFLINE' && offlineBatches.length > 0 && !selectedBatchId)}
                                        className="w-full h-16 bg-[#5C2D91] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition-all hover:bg-[#4A2475] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                                    >
                                        {enrolling ? 'প্রসেসিং...' : 'এখনই ভর্তি হোন'} <ArrowRight size={20} />
                                    </button>
                                )}
                                <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">নিরাপদ পেমেন্ট গ্যারান্টি</p>
                            </div>
                        </div>

                     
                    </aside>
                </div>
            </div>

            <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-black">অর্ডার তথ্য</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">
                        {course.type === 'OFFLINE'
                            ? 'অফলাইন কোর্সের জন্য যোগাযোগ ও ঠিকানা দিন। প্রিন্ট বই থাকলে ডেলিভারির জন্যও ব্যবহৃত হবে।'
                            : 'প্রিন্ট বইয়ের ডেলিভারির জন্য ঠিকানা দিন।'}
                    </p>
                    <div className="grid gap-3 py-2">
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
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setDeliveryOpen(false)}>
                            বাতিল
                        </Button>
                        <Button type="button" onClick={submitDeliveryAndEnroll} disabled={enrolling}>
                            {enrolling ? 'প্রসেসিং...' : 'ভর্তি চালিয়ে যান'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-black">
                            <Receipt className="h-5 w-5 text-indigo-600" />
                            ইনভয়েস তৈরি হয়েছে
                        </DialogTitle>
                        <DialogDescription className="text-left text-base font-medium text-slate-600">
                            ভর্তি সম্পন্ন হয়েছে। নিচের বোতামে PDF দেখুন বা অনলাইন পেমেন্ট চালিয়ে যান।
                        </DialogDescription>
                    </DialogHeader>
                    {createdInvoice ? (
                        <div className="space-y-3 text-sm text-slate-700">
                            <p>
                                <span className="font-bold text-slate-500">ইনভয়েস ID:</span>{' '}
                                <span className="font-mono text-xs">{createdInvoice.id}</span>
                            </p>
                            <p>
                                <span className="font-bold text-slate-500">মোট:</span> ৳
                                {(createdInvoice.total ?? enrollTotal).toLocaleString()}
                            </p>
                            <p className="text-slate-500">
                                পেমেন্ট করুন অথবা ইনভয়েস PDF দেখে রাখুন।
                            </p>
                        </div>
                    ) : null}
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" className="gap-2" onClick={() => void openInvoicePdf()}>
                            <Download className="h-4 w-4" />
                            PDF দেখুন
                        </Button>
                        <Button type="button" className="gap-2 bg-[#5C2D91] hover:bg-[#4A2475]" onClick={() => void payInvoiceNow()}>
                            পেমেন্ট করুন <ArrowRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
