'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin,
  Send
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-32">
      {/* Floating Subscription Card - The "Premium" Touch */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-20">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              নতুন কোর্সের আপডেট পেতে চান?
            </h3>
            <p className="text-slate-500 font-medium mt-2">আমাদের নিউজলেটারে সাবস্ক্রাইব করে যুক্ত থাকুন।</p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto flex items-center bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all">
            <input 
              type="email" 
              placeholder="আপনার ইমেইল..." 
              className="bg-transparent border-none focus:ring-0 px-4 py-2 w-full md:w-64 text-slate-900 font-bold outline-none"
            />
            <button className="bg-[#10B981] hover:bg-slate-900 text-white p-3 rounded-xl transition-all flex items-center justify-center group/btn">
              <Send className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="bg-[#0F172A] text-white pt-48 pb-12 rounded-t-[60px] lg:mx-4 shadow-2xl overflow-hidden relative">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
            
            {/* Column 1: Branding (Spans 4 columns) */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Zap className="h-8 w-8 fill-current" />
                </div>
                <div className="text-3xl font-black tracking-tighter">
                  স্পন্দন<span className="text-emerald-400">প্রো।</span>
                </div>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                আমরা বিশ্বাস করি মানসম্মত শিক্ষা সবার অধিকার। প্রযুক্তির মাধ্যমে শিক্ষাকে সহজলভ্য করাই আমাদের মূল লক্ষ্য।
              </p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                  <motion.button 
                    key={i} 
                    whileHover={{ y: -5 }}
                    className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 transition-all group"
                  >
                    <Icon className="h-5 w-5 text-slate-400 group-hover:text-white" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Column 2 & 3: Links (Spans 5 columns) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">জনপ্রিয় কোর্স</h4>
                <ul className="space-y-4 font-bold text-slate-300">
                  {['একাডেমিক প্রোগ্রাম', 'মেডিকেল প্রস্তুতি', 'ইঞ্জিনিয়ারিং', 'ভার্সিটি ক ইউনিট'].map(item => (
                    <li key={item}>
                      <Link href="#" className="hover:text-emerald-400 flex items-center gap-2 transition-all group">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-400 group-hover:scale-125 transition-all" /> 
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">লিঙ্কসমূহ</h4>
                <ul className="space-y-4 font-bold text-slate-300">
                  {['আমাদের সম্পর্কে', 'ক্যারিয়ার', 'প্রাইভেসি পলিসি', 'সচরাচর জিজ্ঞাসা'].map(item => (
                    <li key={item}>
                      <Link href="#" className="hover:text-emerald-400 flex items-center gap-2 transition-all group">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-all" /> 
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 4: Contact (Spans 3 columns) */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">সরাসরি যোগাযোগ</h4>
              <div className="space-y-5">
                <a href="tel:+8801700000000" className="flex items-center gap-4 group bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-slate-200">+৮৮০ ১৭০০-০০০০০০</span>
                </a>
                <a href="mailto:support@spondonpro.com" className="flex items-center gap-4 group bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-slate-200">ইমেইল করুন</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500">
            <p className="text-sm font-bold italic">
              © ২০২৬ <span className="text-slate-300">স্পন্দন প্রো</span> | Built with excellence.
            </p>
            <div className="flex items-center gap-6">
               {/* Replace with your monochromatic payment icons for premium feel */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/SSLCommerz_Logo.png" 
                alt="Payment" 
                className="h-7 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500" 
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}