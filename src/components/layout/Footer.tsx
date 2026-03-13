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
  MapPin 
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-20">
      {/* Upper rounded shape for transition */}
      <div className="absolute top-0 left-0 w-full h-24 bg-white rounded-b-[64px] z-10" />
      
      <div className="bg-gradient-to-br from-[#1F3E76] via-[#5C2D91] to-[#FF2D8C] text-white pt-32 pb-12 rounded-t-[64px] mx-2 lg:mx-6 shadow-[0_-20px_50px_rgba(92,45,145,0.3)]">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            
            {/* Column 1: Branding & Social */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#5C2D91] shadow-xl">
                  <Zap className="h-7 w-7 fill-current" />
                </div>
                <div className="text-3xl font-black tracking-tighter">
                  স্পন্দন<span className="text-white/80">প্রো।</span>
                </div>
              </div>
              <p className="text-white/70 font-medium leading-relaxed">
                বাংলাদেশের শীর্ষস্থানীয় লার্নিং প্ল্যাটফর্ম। আমরা বিশ্বাস করি মানসম্মত শিক্ষা সবার অধিকার। আমাদের সাথে আপনার শেখার যাত্রা হোক আনন্দদায়ক।
              </p>
              <div className="flex gap-4">
                {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                  <motion.button 
                    key={i} 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#5C2D91] transition-all"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Column 2: Popular Courses */}
            <div className="space-y-8">
              <h4 className="text-xl font-black border-b-2 border-[#FF2D8C] w-fit pb-2">জনপ্রিয় কোর্স</h4>
              <ul className="space-y-4 font-bold text-white/70">
                {['একাডেমিক প্রোগ্রাম', 'লক্ষ্য জিপিএ-৫', 'মেডিকেল ভর্তি প্রস্তুতি', 'ইঞ্জিনিয়ারিং স্পেশাল', 'ভার্সিটি ক ইউনিটি'].map(item => (
                  <li key={item}>
                    <Link href="#" className="hover:text-white hover:translate-x-2 flex items-center gap-2 transition-all">
                      <ArrowRight className="h-4 w-4 text-[#FF2D8C]" /> {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Quick Links */}
            <div className="space-y-8">
              <h4 className="text-xl font-black border-b-2 border-[#FF2D8C] w-fit pb-2">প্রয়োজনীয় লিঙ্ক</h4>
              <ul className="space-y-4 font-bold text-white/70">
                {['আমাদের সম্পর্কে', 'ব্রাঞ্চ ম্যাপ', 'ক্যারিয়ার', 'প্রাইভেসি পলিসি', 'শর্তাবলী', 'সচরাচর জিজ্ঞাসা'].map(item => (
                  <li key={item}>
                    <Link href="#" className="hover:text-white hover:translate-x-2 flex items-center gap-2 transition-all">
                      <ArrowRight className="h-4 w-4 text-[#FF2D8C]" /> {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div className="space-y-8">
              <h4 className="text-xl font-black border-b-2 border-[#FF2D8C] w-fit pb-2">যোগাযোগ করুন</h4>
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#FF2D8C] transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white/50 uppercase">হটলাইন</p>
                    <p className="font-bold">+৮৮০ ১৭০০-০০০০০০</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#FF2D8C] transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white/50 uppercase">ইমেইল</p>
                    <p className="font-bold">support@spondonpro.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#FF2D8C] transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white/50 uppercase">অফিস</p>
                    <p className="font-bold">লেভেল ১২, স্পন্দন টাওয়ার, পান্থপথ, ঢাকা</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright Section */}
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-sm font-bold text-white/50">
                © ২০২৬ স্পন্দন প্রো টেকনোলজিস লিমিটেড। সর্বস্বত্ব সংরক্ষিত।
              </p>
            </div>
            <div className="flex items-center gap-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/SSLCommerz_Logo.png" alt="Payment" className="h-8 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
