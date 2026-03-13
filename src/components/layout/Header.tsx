'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1 group">
            <div className="text-3xl font-black tracking-tighter text-[#5C2D91] flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-[#5C2D91] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                <Zap className="h-6 w-6 fill-white" />
              </div>
              স্পন্দন<span className="text-[#FF2D8C]">প্রো।</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            {['স্কুল', 'একাডেমিক', 'লক্ষ্য জিপিএ-৫', 'ভর্তি প্রস্তুতি'].map((item) => (
              <button key={item} className="flex items-center gap-1 text-[15px] font-bold text-slate-600 hover:text-[#5C2D91]">
                {item} <ChevronDown className="h-4 w-4" />
              </button>
            ))}
            <Link href="#branches" className="text-[15px] font-bold text-slate-600 hover:text-[#5C2D91]">ব্রাঞ্চসমূহ</Link>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" className="rounded-xl border-[#5C2D91] text-[#5C2D91] font-bold px-6">লগ ইন / সাইন আপ</Button>
          </Link>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 p-6 space-y-4 animate-in slide-in-from-top duration-300">
          {['স্কুল', 'একাডেমিক', 'লক্ষ্য জিপিএ-৫', 'ভর্তি প্রস্তুতি'].map((item) => (
            <button key={item} className="block w-full text-left py-2 text-base font-bold text-slate-600 hover:text-[#5C2D91]">
              {item}
            </button>
          ))}
          <Link href="#branches" className="block py-2 text-base font-bold text-slate-600 hover:text-[#5C2D91]">ব্রাঞ্চসমূহ</Link>
          <Link href="/login" className="block">
            <Button className="w-full rounded-xl bg-[#5C2D91] text-white font-bold">লগ ইন / সাইন আপ</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
