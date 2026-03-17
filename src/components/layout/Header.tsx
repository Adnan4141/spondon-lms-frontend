'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const ADMIN_ROLES = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTS', 'MODERATOR'];

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      const role = document.cookie.split('; ').find(r => r.startsWith('user_role='))?.split('=')[1];
      if (token && userStr) {
        const u = JSON.parse(userStr);
        setUser({ fullName: u.fullName || 'User', role: role || u.role || '' });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
      setUser(null);
      router.push('/login');
    }
  };

  const getDashboardHref = () => {
    if (!user?.role) return '/login';
    if (ADMIN_ROLES.includes(user.role)) return '/admin';
    if (user.role === 'TEACHER') return '/teacher';
    return '/student';
  };

  const navLinks = [
    { name: 'সকল কোর্স', href: '/courses' },
    { name: 'যোগাযোগ', href: '/branches' },
    { name: 'আমাদের সম্পর্কে', href: '/about-us' }
  ]

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-500',
        scrolled 
          ? 'py-0' // Tighten up on scroll
          : 'py-4'  // Breathable space at top
      )}
    >
      {/* Background Layer - Smooth transition between glass and transparent */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-500 ease-in-out -z-10",
          scrolled 
            ? "bg-white/80 backdrop-blur-xl opacity-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]" 
            : "bg-transparent opacity-0"
        )} 
      />

      {/* Border Bottom Animation - Smooth 1px line */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 h-[1px] bg-slate-200 transition-all duration-700 ease-in-out -z-10",
          scrolled ? "w-full opacity-100" : "w-0 opacity-0"
        )} 
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-12 flex items-center justify-between h-20 transition-all duration-500">
        
        {/* Logo */}
        <Link href="/" className="relative z-50 flex items-center shrink-0">
          <Image
            src="/images/logo/spondon-logo.png"
            alt="Spondon Logo"
            width={200}
            height={65}
            priority
            className={cn(
              "object-contain transition-all duration-500",
              !scrolled && "brightness-0 invert"
            )}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "group relative text-[17px] font-bold tracking-tight transition-colors duration-300",
                scrolled ? 'text-slate-700' : 'text-white'
              )}
            >
              <span className="relative z-10">{link.name}</span>
              
              {/* Animated Underline */}
              <span className={cn(
                "absolute -bottom-1 left-0 h-[2px] transition-all duration-300 group-hover:w-full w-0",
                scrolled ? "bg-[#5C2D91]" : "bg-white"
              )} />
            </Link>
          ))}
        </div>

        {/* Action Button */}
        <div className="hidden lg:flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href={getDashboardHref()}>
                <Button className={cn(
                  "rounded-2xl px-6 h-11 font-bold transition-all duration-500 active:scale-95 shadow-sm",
                  scrolled 
                    ? "bg-[#5C2D91] hover:bg-[#FF2D8C] text-white" 
                    : "bg-white text-[#5C2D91] hover:shadow-xl hover:shadow-white/20"
                )}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  ড্যাশবোর্ড
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  "rounded-2xl px-4 h-11 font-bold transition-all flex items-center gap-2",
                  scrolled ? "text-slate-600 hover:text-rose-500" : "text-white/90 hover:text-white"
                )}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button className={cn(
                "rounded-2xl px-8 h-11 font-bold transition-all duration-500 active:scale-95 shadow-sm",
                scrolled 
                  ? "bg-[#5C2D91] hover:bg-[#FF2D8C] text-white" 
                  : "bg-white text-[#5C2D91] hover:shadow-xl hover:shadow-white/20"
              )}>
                লগ ইন / সাইন আপ
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "lg:hidden relative z-50 p-2.5 rounded-2xl transition-all duration-300",
            scrolled 
              ? "bg-slate-100 text-slate-900" 
              : "bg-white/10 text-white backdrop-blur-md border border-white/20"
          )}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Blur to focus on menu */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden -z-20"
            />
            
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              className="lg:hidden bg-white overflow-hidden shadow-2xl rounded-b-[2rem]"
            >
              <div className="px-8 py-10 space-y-6">
                {navLinks.map((link, idx) => (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    key={link.name}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-2xl font-black text-slate-800 active:text-[#5C2D91]"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-6 space-y-3"
                >
                  {user ? (
                    <>
                      <Link href={getDashboardHref()} onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full h-16 rounded-[1.25rem] bg-[#5C2D91] text-white text-xl font-black shadow-lg shadow-indigo-200">
                          <LayoutDashboard className="h-5 w-5 mr-2" />
                          ড্যাশবোর্ড
                        </Button>
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="w-full h-14 rounded-[1.25rem] border-2 border-slate-200 text-slate-700 font-black flex items-center justify-center gap-2"
                      >
                        <LogOut className="h-5 w-5" />
                        লগ আউট
                      </button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-16 rounded-[1.25rem] bg-[#5C2D91] text-white text-xl font-black shadow-lg shadow-indigo-200">
                        লগ ইন / সাইন আপ
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}