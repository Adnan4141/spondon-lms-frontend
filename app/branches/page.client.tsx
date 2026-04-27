'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getBranches, Branch } from '@/lib/api/branches';
import {
  MapPin,
  Phone,
  Search,
  Building2,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BranchesPageClient({ initialSiteSettings }: { initialSiteSettings: Record<string, string> }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBranches();
      if (res.success) {
        setBranches(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = useMemo(() => {
    return branches
      .filter(branch =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (branch.address && branch.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (branch.code && branch.code.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  }, [branches, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <Header />

      <div className="bg-[#0F172A] pt-32 pb-20 relative overflow-hidden ">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />

        <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter"
          >
            সারা দেশে আমাদের <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">ব্রাঞ্চসমূহ</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg font-medium max-w-2xl mx-auto"
          >
            আপনার নিকটস্থ স্পন্দন ব্রাঞ্চটি খুঁজে নিন এবং মানসম্মত শিক্ষা গ্রহণের যাত্রা শুরু করুন।
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-[85rem] mb-20 px-6 lg:px-12 py-16">
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
            <input
              type="text"
              placeholder="ব্রাঞ্চের নাম বা ঠিকানা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-20 pl-16 pr-8 rounded-[28px] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 focus:border-[#5C2D91] focus:ring-4 focus:ring-[#5C2D91]/5 outline-none font-bold text-lg text-slate-700 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 rounded-[40px] bg-white animate-pulse border border-slate-100 shadow-sm" />
              ))}
            </div>
          ) : filteredBranches.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredBranches.map((branch) => (
                <motion.div
                  key={branch.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="group bg-white rounded-[40px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-[#5C2D91] group-hover:text-white transition-all duration-500 shadow-inner">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      Active
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-[#5C2D91] transition-colors line-clamp-1">
                    {branch.name}
                  </h3>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3 text-slate-500">
                      <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium leading-relaxed line-clamp-2">
                        {branch.address || 'ঠিকানা পাওয়া যায়নি'}
                      </p>
                    </div>
                    {branch.phone && (
                      <div className="flex items-center gap-3 text-slate-500">
                        <Phone className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                        <p className="text-sm font-bold">{branch.phone}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-500">
                      <Clock className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                      <p className="text-sm font-medium">সকাল ৯:০০ - রাত ৯:০০</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">কোনো ব্রাঞ্চ পাওয়া যায়নি</h3>
              <p className="text-slate-500 font-medium mb-8">অন্য কোনো নাম বা ঠিকানা দিয়ে পুনরায় চেষ্টা করুন।</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-8 py-3 rounded-xl bg-[#5C2D91] text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 cursor-pointer"
              >
                সার্চ ক্লিয়ার করুন
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer siteSettings={initialSiteSettings} />
    </div>
  );
}
