'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/landing/shared/CourseCard';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import type { Course, Program } from '@/types/course';
import {
    Search,
    SlidersHorizontal,
    X,
    Filter,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters State
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedPrice, setSelectedPrice] = useState<string>('all');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, text: string = 'No Image') => {
        e.currentTarget.src = `https://placehold.co/600x400/5C2D91/white?text=${text}`;
    };

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [programsRes, coursesRes] = await Promise.all([
                getPrograms(),
                getCourses({ websiteVisible: true, status: 'ACTIVE', limit: 100 })
            ]);

            if (programsRes.success) setPrograms(programsRes.data || []);
            if (coursesRes.success) setCourses(coursesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const filteredCourses = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return courses.filter(course => {
            const desc = typeof course.description === 'string' ? course.description.toLowerCase() : '';
            const prog = course.program?.name?.toLowerCase() ?? '';
            const matchesSearch = !q ||
                course.name.toLowerCase().includes(q) ||
                course.code.toLowerCase().includes(q) ||
                desc.includes(q) ||
                prog.includes(q);
            const matchesProgram = selectedProgram === 'all' || course.programId === selectedProgram;
            const matchesType = selectedType === 'all' || course.type === selectedType;
            const matchesPrice = selectedPrice === 'all' ||
                (selectedPrice === 'free' ? Number(course.fee) === 0 : Number(course.fee) > 0);

            return matchesSearch && matchesProgram && matchesType && matchesPrice;
        });
    }, [courses, searchQuery, selectedProgram, selectedType, selectedPrice]);

    const clearFilters = () => {
        setSelectedProgram('all');
        setSelectedType('all');
        setSelectedPrice('all');
        setSearchQuery('');
    };

    const FilterSection = ({ title, options, value, onChange }: any) => (
        <div className="space-y-4 mb-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">{title}</h4>
            <div className="flex flex-col gap-2">
                {options.map((opt: any) => (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 text-left group cursor-pointer",
                            value === opt.id
                                ? "bg-[#5C2D91]/5 border-[#5C2D91]/20 text-[#5C2D91] font-bold"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                        )}
                    >
                        <span className="text-sm">{opt.label}</span>
                        <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                            value === opt.id ? "bg-[#5C2D91] border-[#5C2D91]" : "border-slate-200 group-hover:border-slate-400"
                        )}>
                            {value === opt.id && <Check className="h-3 w-3 text-white" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
            <Header />

            {/* Hero Header */}
            <div className="bg-[#0F172A] pt-32 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />

                <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter"
                    >
                        আমাদের সকল <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">কোর্সসমূহ</span>
                    </motion.h1>
                    <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
                        আপনার পছন্দের প্রোগ্রাম এবং মোড অনুযায়ী কোর্স খুঁজে নিন এবং আজই ভর্তি হয়ে আপনার স্বপ্ন পূরণের যাত্রা শুরু করুন।
                    </p>
                </div>
            </div>

            <div className="mx-auto md:max-w-7xl lg:max-w-380 px-6 lg:px-12 py-12">
                <div className="flex flex-col lg:flex-row gap-12 mb-30">

                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden lg:block w-80 flex-shrink-0">
                        <div className="sticky top-28 space-y-8">
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                         ফিল্টার
                                    </h3>
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs font-bold text-[#FF2D8C] hover:underline cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                <FilterSection
                                    title="প্রোগ্রাম"
                                    value={selectedProgram}
                                    onChange={setSelectedProgram}
                                    options={[
                                        { id: 'all', label: 'সকল প্রোগ্রাম' },
                                        ...programs.map(p => ({ id: p.id, label: p.name }))
                                    ]}
                                />

                                <FilterSection
                                    title="কোর্স মোড"
                                    value={selectedType}
                                    onChange={setSelectedType}
                                    options={[
                                        { id: 'all', label: 'সকল মোড' },
                                        { id: 'ONLINE', label: 'অনলাইন' },
                                        { id: 'OFFLINE', label: 'অফলাইন' }
                                    ]}
                                />

                                <FilterSection
                                    title="প্রাইসিং"
                                    value={selectedPrice}
                                    onChange={setSelectedPrice}
                                    options={[
                                        { id: 'all', label: 'সকল কোর্স' },
                                        { id: 'free', label: 'ফ্রি কোর্স' },
                                        { id: 'paid', label: 'পেইড কোর্স' }
                                    ]}
                                />
                            </div>

                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Search and Mobile Filter Toggle */}
                        <div className="flex flex-col md:flex-row gap-4 mb-10">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="কোর্সের নাম বা কোড দিয়ে খুঁজুন..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white border border-slate-100 shadow-sm focus:border-[#5C2D91] focus:ring-4 focus:ring-[#5C2D91]/5 outline-none font-bold text-slate-700 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="lg:hidden h-16 px-8 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                            >
                                <SlidersHorizontal className="h-5 w-5" /> ফিল্টার
                            </button>
                        </div>

                        {/* Courses Grid */}
                        <div className="min-h-[400px]">
                            {loading ? (
                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="bg-white animate-pulse border border-slate-100 shadow-sm h-[380px] rounded-[32px]" />
                                    ))}
                                </div>
                            ) : filteredCourses.length > 0 ? (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.08 }
                                        }
                                    }}
                                    className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                                >
                                    {filteredCourses.map(course => (
                                        <CourseCard key={course.id} course={course} handleImageError={handleImageError} />
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                                        <Search size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">কোনো কোর্স পাওয়া যায়নি</h3>
                                    <p className="text-slate-500 font-medium mb-8">আপনার সার্চ কোয়েরি বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
                                    <button
                                        onClick={clearFilters}
                                        className="px-8 py-3 rounded-xl bg-[#5C2D91] text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 cursor-pointer"
                                    >
                                        ফিল্টার ক্লিয়ার করুন
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <Footer />

            {/* Mobile Filter Slide-over */}
            <AnimatePresence>
                {isMobileFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] cursor-pointer"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl p-8 overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                <h3 className="text-2xl font-black text-slate-900">ফিল্টার</h3>
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <FilterSection
                                    title="প্রোগ্রাম"
                                    value={selectedProgram}
                                    onChange={setSelectedProgram}
                                    options={[
                                        { id: 'all', label: 'সকল প্রোগ্রাম' },
                                        ...programs.map(p => ({ id: p.id, label: p.name }))
                                    ]}
                                />

                                <FilterSection
                                    title="কোর্স মোড"
                                    value={selectedType}
                                    onChange={setSelectedType}
                                    options={[
                                        { id: 'all', label: 'সকল মোড' },
                                        { id: 'ONLINE', label: 'অনলাইন' },
                                        { id: 'OFFLINE', label: 'অফলাইন' }
                                    ]}
                                />

                                <FilterSection
                                    title="প্রাইসিং"
                                    value={selectedPrice}
                                    onChange={setSelectedPrice}
                                    options={[
                                        { id: 'all', label: 'সকল কোর্স' },
                                        { id: 'free', label: 'ফ্রি কোর্স' },
                                        { id: 'paid', label: 'পেইড কোর্স' }
                                    ]}
                                />

                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="w-full py-5 bg-[#5C2D91] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 mt-10 cursor-pointer"
                                >
                                    ফলাফল দেখুন
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="w-full py-5 border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    ফিল্টার ক্লিয়ার করুন
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
