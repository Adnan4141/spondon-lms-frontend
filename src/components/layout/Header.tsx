'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'সকল কোর্স', href: '#courses' },
    { name: 'যোগাযোগ', href: '#contact' },
    { name: 'আমাদের সম্পর্কে', href: '#about' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-500 ease-in-out',
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3 shadow-sm' 
          : 'bg-transparent border-transparent py-6'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 group">
          <div className={cn(
            "text-3xl font-black tracking-tighter transition-colors duration-500",
            scrolled ? "text-[#5C2D91]" : "text-white"
          )}>
            স্পন্দন
          </div>
        
        </Link>
        
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="relative group py-2"
            >
              <span 
                className={cn(
                  "text-[18px] font-bold transition-all duration-500",
                  scrolled ? "text-slate-600 hover:text-[#5C2D91]" : "text-white/80 hover:text-white"
                )}
              >
                {link.name}
              </span>
              <span className={cn(
                "absolute -bottom-1 left-0 h-[2px] w-0 bg-[#FF2D8C] transition-all duration-300 group-hover:w-full",
                !scrolled && "bg-emerald-400"
              )} />
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <Link href="/login">
            <button className={cn(
              "px-8 py-3 text-[15px] cursor-pointer rounded-2xl font-black uppercase tracking-widest transition-all duration-500 active:scale-95",
              scrolled 
                ? "bg-slate-900 text-white hover:bg-[#5C2D91] shadow-lg shadow-indigo-100" 
                : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900"
            )}>
              লগ ইন / সাইন আপ
            </button>
          </Link>
        </div>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className={cn(
            "lg:hidden p-3 rounded-2xl transition-all duration-500",
            scrolled ? "text-slate-900 bg-slate-50" : "text-white bg-white/10 backdrop-blur-md"
          )}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="p-8 space-y-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-left text-lg font-black text-slate-800 hover:text-[#5C2D91] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4">
                <Link href="/login">
                  <Button className="w-full h-16 rounded-2xl bg-[#5C2D91] hover:bg-[#FF2D8C] text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100">
                    লগ ইন / সাইন আপ
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
