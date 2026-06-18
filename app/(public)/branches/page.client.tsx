'use client';

import React, { useMemo, useState } from 'react';
import type { Branch } from '@/lib/api/branches';
import { MapPin, Phone, Search, Building2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
  initialBranches: Branch[];
};

export default function BranchesPageClient({ initialBranches }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBranches = useMemo(() => {
    return initialBranches
      .filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (branch.address && branch.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (branch.code && branch.code.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  }, [initialBranches, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <div className="relative overflow-hidden bg-[#0F172A] pb-20 pt-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-black tracking-tighter text-white md:text-6xl"
          >
            সারা দেশে আমাদের{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              ব্রাঞ্চসমূহ
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg font-medium text-slate-400"
          >
            আপনার নিকটস্থ স্পন্দন ব্রাঞ্চটি খুঁজে নিন এবং মানসম্মত শিক্ষা গ্রহণের যাত্রা শুরু করুন।
          </motion.p>
        </div>
      </div>

      <div className="mx-auto mb-20 max-w-[85rem] px-6 py-16 lg:px-12">
        <div className="mx-auto mb-16 max-w-2xl">
          <div className="group relative">
            <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5C2D91]" />
            <input
              type="text"
              placeholder="ব্রাঞ্চের নাম বা ঠিকানা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-20 w-full rounded-[28px] border border-slate-100 bg-white pl-16 pr-8 text-lg font-bold text-slate-700 shadow-xl shadow-slate-200/20 outline-none transition-all placeholder:text-slate-300 focus:border-[#5C2D91] focus:ring-4 focus:ring-[#5C2D91]/5"
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          {filteredBranches.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
              }}
              className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredBranches.map((branch) => (
                <motion.div
                  key={branch.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="group flex h-full flex-col rounded-[40px] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50"
                >
                  <div className="mb-8 flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner transition-all duration-500 group-hover:bg-[#5C2D91] group-hover:text-white">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      Active
                    </div>
                  </div>

                  <h3 className="mb-4 line-clamp-1 text-2xl font-black text-slate-900 transition-colors group-hover:text-[#5C2D91]">
                    {branch.name}
                  </h3>

                  <div className="mb-8 flex-1 space-y-4">
                    <div className="flex items-start gap-3 text-slate-500">
                      <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" />
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed">
                        {branch.address || 'ঠিকানা পাওয়া যায়নি'}
                      </p>
                    </div>
                    {branch.phone ? (
                      <div className="flex items-center gap-3 text-slate-500">
                        <Phone className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                        <p className="text-sm font-bold">{branch.phone}</p>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3 text-slate-500">
                      <Clock className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                      <p className="text-sm font-medium">সকাল ৯:০০ - রাত ৯:০০</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search size={40} />
              </div>
              <h3 className="mb-2 text-2xl font-black text-slate-900">কোনো ব্রাঞ্চ পাওয়া যায়নি</h3>
              <p className="mb-8 font-medium text-slate-500">অন্য কোনো নাম বা ঠিকানা দিয়ে পুনরায় চেষ্টা করুন।</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="cursor-pointer rounded-xl bg-[#5C2D91] px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100"
              >
                সার্চ ক্লিয়ার করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
