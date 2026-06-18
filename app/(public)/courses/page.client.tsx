'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseCard } from '@/components/landing/shared/CourseCard';
import type { Course, Program } from '@/types/course';
import { Search, SlidersHorizontal, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type FilterOption = { id: string; label: string };

type FilterSectionProps = {
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
};

function FilterSection({ title, options, value, onChange }: FilterSectionProps) {
  return (
    <div className="mb-8 space-y-4">
      <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">{title}</h4>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'group flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-300',
              value === opt.id
                ? 'border-[#5C2D91]/20 bg-[#5C2D91]/5 font-bold text-[#5C2D91]'
                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            <span className="text-sm">{opt.label}</span>
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                value === opt.id
                  ? 'border-[#5C2D91] bg-[#5C2D91]'
                  : 'border-slate-200 group-hover:border-slate-400',
              )}
            >
              {value === opt.id ? <Check className="h-3 w-3 text-white" /> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

type CoursesPageClientProps = {
  initialCourses: Course[];
  initialPrograms: Program[];
};

function CoursesPageContent({ initialCourses, initialPrograms }: CoursesPageClientProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (initialPrograms.length === 0) return;

    const programIdFromQuery = searchParams.get('programId');
    if (programIdFromQuery && initialPrograms.some((p) => p.id === programIdFromQuery)) {
      setSelectedProgram(programIdFromQuery);
      return;
    }

    const programNameFromQuery = searchParams.get('program');
    if (!programNameFromQuery) return;

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/\+/g, ' ')
        .replace(/[^a-z0-9\u0980-\u09ff\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const target = normalize(programNameFromQuery);
    const matched = initialPrograms.find((p) => {
      const n = normalize(p.name);
      return n === target || n.includes(target) || target.includes(n);
    });

    if (matched) {
      setSelectedProgram(matched.id);
    }
  }, [initialPrograms, searchParams]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialCourses.filter((course) => {
      const desc = typeof course.description === 'string' ? course.description.toLowerCase() : '';
      const prog = course.program?.name?.toLowerCase() ?? '';
      const matchesSearch =
        !q ||
        course.name.toLowerCase().includes(q) ||
        course.slug.toLowerCase().includes(q) ||
        desc.includes(q) ||
        prog.includes(q);
      const matchesProgram = selectedProgram === 'all' || course.programId === selectedProgram;
      const matchesType = selectedType === 'all' || course.type === selectedType;
      const matchesPrice =
        selectedPrice === 'all' ||
        (selectedPrice === 'free' ? Number(course.fee) === 0 : Number(course.fee) > 0);

      return matchesSearch && matchesProgram && matchesType && matchesPrice;
    });
  }, [initialCourses, searchQuery, selectedProgram, selectedType, selectedPrice]);

  const clearFilters = () => {
    setSelectedProgram('all');
    setSelectedType('all');
    setSelectedPrice('all');
    setSearchQuery('');
  };

  const programOptions: FilterOption[] = [
    { id: 'all', label: 'সকল প্রোগ্রাম' },
    ...initialPrograms.map((p) => ({ id: p.id, label: p.name })),
  ];

  const typeOptions: FilterOption[] = [
    { id: 'all', label: 'সকল মোড' },
    { id: 'ONLINE', label: 'অনলাইন' },
    { id: 'OFFLINE', label: 'অফলাইন' },
  ];

  const priceOptions: FilterOption[] = [
    { id: 'all', label: 'সকল কোর্স' },
    { id: 'free', label: 'ফ্রি কোর্স' },
    { id: 'paid', label: 'পেইড কোর্স' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <div className="relative overflow-hidden bg-[#0F172A] pb-20 pt-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl font-black tracking-tighter text-white md:text-6xl"
          >
            আমাদের সকল{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              কোর্সসমূহ
            </span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-400">
            আপনার পছন্দের প্রোগ্রাম এবং মোড অনুযায়ী কোর্স খুঁজে নিন এবং আজই ভর্তি হয়ে আপনার স্বপ্ন
            পূরণের যাত্রা শুরু করুন।
          </p>
        </div>
      </div>

      <div className="mx-auto px-6 py-12 md:max-w-7xl lg:max-w-380 lg:px-12">
        <div className="mb-30 flex flex-col gap-12 lg:flex-row">
          <aside className="hidden w-80 flex-shrink-0 lg:block">
            <div className="sticky top-28 space-y-8">
              <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between border-b border-slate-50 pb-4">
                  <h3 className="flex items-center gap-2 text-xl font-black text-slate-900">ফিল্টার</h3>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="cursor-pointer text-xs font-bold text-[#FF2D8C] hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <FilterSection
                  title="প্রোগ্রাম"
                  value={selectedProgram}
                  onChange={setSelectedProgram}
                  options={programOptions}
                />
                <FilterSection
                  title="কোর্স মোড"
                  value={selectedType}
                  onChange={setSelectedType}
                  options={typeOptions}
                />
                <FilterSection
                  title="প্রাইসিং"
                  value={selectedPrice}
                  onChange={setSelectedPrice}
                  options={priceOptions}
                />
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-10 flex flex-col gap-4 md:flex-row">
              <div className="group relative flex-1">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5C2D91]" />
                <input
                  type="text"
                  placeholder="কোর্সের নাম বা কোড দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 w-full rounded-2xl border border-slate-100 bg-white pl-14 pr-6 font-bold text-slate-700 shadow-sm outline-none transition-all focus:border-[#5C2D91] focus:ring-4 focus:ring-[#5C2D91]/5"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-8 font-bold text-slate-700 shadow-sm lg:hidden"
              >
                <SlidersHorizontal className="h-5 w-5" /> ফিল্টার
              </button>
            </div>

            <div className="min-h-[400px]">
              {filteredCourses.length > 0 ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.08 },
                    },
                  }}
                  className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search size={40} />
                  </div>
                  <h3 className="mb-2 text-2xl font-black text-slate-900">কোনো কোর্স পাওয়া যায়নি</h3>
                  <p className="mb-8 font-medium text-slate-500">
                    আপনার সার্চ কোয়েরি বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="cursor-pointer rounded-xl bg-[#5C2D91] px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100"
                  >
                    ফিল্টার ক্লিয়ার করুন
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isMobileFilterOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 z-[60] cursor-pointer bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[70] w-[85%] max-w-sm overflow-y-auto bg-white p-8 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-2xl font-black text-slate-900">ফিল্টার</h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <FilterSection
                  title="প্রোগ্রাম"
                  value={selectedProgram}
                  onChange={setSelectedProgram}
                  options={programOptions}
                />
                <FilterSection
                  title="কোর্স মোড"
                  value={selectedType}
                  onChange={setSelectedType}
                  options={typeOptions}
                />
                <FilterSection
                  title="প্রাইসিং"
                  value={selectedPrice}
                  onChange={setSelectedPrice}
                  options={priceOptions}
                />

                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="mt-10 w-full cursor-pointer rounded-2xl bg-[#5C2D91] py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100"
                >
                  ফলাফল দেখুন
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full cursor-pointer rounded-2xl border border-slate-200 py-5 text-sm font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                >
                  ফিল্টার ক্লিয়ার করুন
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function CoursesPageClient(props: CoursesPageClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CoursesPageContent {...props} />
    </Suspense>
  );
}
