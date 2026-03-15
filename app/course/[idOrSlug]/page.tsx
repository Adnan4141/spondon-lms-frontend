'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getCourseById } from '@/lib/api/courses';
import type { CourseDetails } from '@/types/course';
import { 
    BookOpen, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    ArrowRight, 
    Users, 
    ShieldCheck, 
    Info,
    Layout,
    Globe,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CourseDetailsPage() {
    const { idOrSlug } = useParams();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getCourseById(idOrSlug as string);
            if (res.success && res.data) {
                setCourse(res.data as CourseDetails);
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

    const outline = course.outline as any;
    const syllabus = Array.isArray(outline?.syllabus) ? outline.syllabus : [];
    const benefits = Array.isArray(outline?.benefits) ? outline.benefits : [
        'অভিজ্ঞ শিক্ষক মন্ডলী',
        'মানসম্মত লেকচার শিট',
        'নিয়মিত মডেল টেস্ট',
        'সাপ্তাহিক সলভ ক্লাস'
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
            <Header />

            {/* Hero Section */}
            <div className="relative bg-[#0F172A] pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
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
                            <p className="text-slate-400 text-lg font-medium mb-10 max-w-xl leading-relaxed">
                                {course.description || 'আপনার স্বপ্ন পূরণের যাত্রায় আমরা আছি আপনার পাশে। মানসম্মত শিক্ষা এবং সঠিক নির্দেশনায় গড়ে তুলুন আপনার ভবিষ্যৎ।'}
                            </p>

                            <div className="flex flex-wrap gap-6 mb-12">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">এনরোলড</span>
                                        <span className="text-sm font-bold text-white">৫০০+ শিক্ষার্থী</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                                        <Clock size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">সময়কাল</span>
                                        <span className="text-sm font-bold text-white">০৬ মাস</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">ভর্তি চলছে</span>
                                        <span className="text-sm font-bold text-white">জুলাই ব্যাচ</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative aspect-video rounded-[40px] overflow-hidden border-8 border-white/5 shadow-2xl">
                                <img
                                    src={course.thumbnail || 'https://placehold.co/800x450/5C2D91/white?text=Course+Thumbnail'}
                                    alt={course.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">কোর্স ফি</span>
                                        <span className="text-3xl font-black text-white">৳{String(course.fee)}</span>
                                    </div>
                                    <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10">
                                        ভর্তি হোন
                                    </button>
                                </div>
                            </div>
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
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                    <Zap size={24} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">কোর্সটি কেন করবেন?</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {benefits.map((benefit: string, idx: number) => (
                                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-4 transition-all hover:border-indigo-100 group">
                                        <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <p className="font-bold text-slate-700 leading-relaxed">{benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Syllabus / Modules */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                    <BookOpen size={24} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">কোর্স কারিকুলাম</h2>
                            </div>
                            <div className="space-y-4">
                                {syllabus.length > 0 ? syllabus.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <span className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <div>
                                                    <h4 className="font-black text-slate-800 mb-1">{item.title || `Module ${idx + 1}`}</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.duration || '১.৫ ঘণ্টা'}</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={20} className="text-slate-300" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="bg-white p-12 rounded-[40px] border border-dashed border-slate-200 text-center">
                                        <p className="text-slate-400 font-bold">বিস্তারিত সিলেবাস শিঘ্রই যুক্ত করা হবে।</p>
                                    </div>
                                )}
                            </div>
                        </section>
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
                                        <span className="text-[10px] font-black text-slate-400 uppercase">পেমেন্ট মেথড</span>
                                        <span className="font-bold text-slate-700">{course.billingType === 'MONTHLY' ? 'মাসিক পেমেন্ট' : 'এককালীন পেমেন্ট'}</span>
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
                                <div className="flex items-center justify-between mb-8">
                                    <span className="font-black text-slate-500 uppercase text-xs tracking-widest">মোট ফি</span>
                                    <span className="text-4xl font-black text-[#5C2D91]">৳{String(course.fee)}</span>
                                </div>
                                <button className="w-full h-16 bg-[#5C2D91] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 transition-all hover:bg-[#4A2475] active:scale-95 flex items-center justify-center gap-3">
                                    এখনই ভর্তি হোন <ArrowRight size={20} />
                                </button>
                                <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">নিরাপদ পেমেন্ট গ্যারান্টি</p>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                            <h3 className="text-xl font-black mb-2">সহযোগিতা প্রয়োজন?</h3>
                            <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">ভর্তি সংক্রান্ত যেকোনো তথ্যের জন্য সরাসরি আমাদের কল করুন অথবা যোগাযোগ করুন।</p>
                            <a href="tel:01332606020" className="flex items-center gap-4 text-2xl font-black mb-4 hover:translate-x-1 transition-transform">
                                ০১৩৩২৬০৬০২০
                            </a>
                            <div className="h-[1px] bg-white/20 w-full mb-6" />
                            <button className="text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                মেসেজ দিন <ArrowRight size={14} />
                            </button>
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />
        </div>
    );
}
