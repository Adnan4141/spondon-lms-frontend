'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, LogOut, BookOpen, Library, MapPin, Info } from 'lucide-react'
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
    { name: 'সকল কোর্স', href: '/courses', icon: BookOpen },
    { name: 'বইসমূহ', href: '/books', icon: Library },
    { name: 'শাখা সমূহ', href: '/branches', icon: MapPin },
    { name: 'আমাদের সম্পর্কে', href: '/about-us', icon: Info }
  ]

  return (
    <nav
      className={cn(
        'z-50 w-full transition-all duration-500',
        scrolled 
          ? 'fixed top-0 left-0 right-0 py-0' // Fixed with compact spacing on scroll
          : 'py-2 sm:py-4'  // Less padding on mobile
      )}
    >
      {/* Background Layer - Smooth transition between glass and transparent */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-500 ease-in-out -z-10",
          scrolled 
            ? "bg-white/80 backdrop-blur-xl opacity-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]" 
            : "bg-white opacity-100"
        )} 
      />

      {/* Border Bottom Animation - Smooth 1px line */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 h-[1px] bg-slate-200 transition-all duration-700 ease-in-out -z-10",
          scrolled ? "w-full opacity-100" : "w-full opacity-60"
        )} 
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 flex items-center justify-between h-14 sm:h-16 md:h-20 transition-all duration-500">
        
        {/* Logo - responsive size */}
        <Link href="/" className="relative z-50 flex items-center shrink-0">
          <Image
            src="/images/logo/spondon-logo.png"
            alt="Spondon Logo"
            width={200}
            height={65}
            priority
            className="object-contain transition-all duration-500 w-28 sm:w-36 md:w-44 lg:w-[200px] h-auto"
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
                'text-slate-700'
              )}
            >
              <span className="relative z-10">{link.name}</span>
              
              {/* Animated Underline */}
              <span className={cn(
                "absolute -bottom-1 left-0 h-[2px] transition-all duration-300 group-hover:w-full w-0",
                "bg-[#5C2D91]"
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
                  "bg-[#5C2D91] hover:bg-[#FF2D8C] text-white"
                )}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  ড্যাশবোর্ড
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  "rounded-2xl px-4 h-11 font-bold transition-all flex items-center gap-2",
                  "text-slate-600 hover:text-rose-500"
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
                "bg-[#5C2D91] hover:bg-[#FF2D8C] text-white"
              )}>
                লগ ইন / সাইন আপ
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle - touch friendly */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden relative z-[60] p-3 sm:p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 touch-manipulation bg-slate-100 text-slate-900"
        >
          {isMenuOpen ? <X size={22} className="sm:w-6 sm:h-6" /> : <Menu size={22} className="sm:w-6 sm:h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop - full screen, below header */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 top-14 sm:top-16 md:top-20 lg:hidden bg-slate-900/50 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="fixed left-3 right-3 sm:left-4 sm:right-4 top-14 sm:top-16 md:top-20 lg:hidden z-50 max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              <div className="bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 rounded-2xl border border-slate-100 overflow-hidden">
                {/* Nav links - compact on mobile */}
                <div className="px-4 py-5 sm:px-6 sm:py-6 space-y-0.5">
                  {navLinks.map((link, idx) => {
                    const Icon = link.icon;
                    return (
                      <motion.div
                        initial={{ x: -12, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={link.name}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#5C2D91] active:bg-indigo-50 transition-all touch-manipulation group"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-[#5C2D91]/10 group-hover:text-[#5C2D91] transition-colors">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm sm:text-base font-bold">{link.name}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
ad
                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-4" />

                {/* Action buttons */}
                <motion.div 
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 sm:p-6 space-y-3"
                >
                  {user ? (
                    <>
                      <Link href={getDashboardHref()} onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full h-12 sm:h-14 rounded-xl bg-gradient-to-r from-[#5C2D91] to-[#7B3FA3] hover:from-[#4A2475] hover:to-[#5C2D91] text-white text-sm sm:text-base font-bold shadow-lg shadow-indigo-200/50 touch-manipulation">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          ড্যাশবোর্ড
                        </Button>
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="w-full h-11 sm:h-12 rounded-xl border border-slate-200 text-slate-600 text-sm sm:text-base font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-colors touch-manipulation"
                      >
                        <LogOut className="h-4 w-4" />
                        লগ আউট
                      </button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-12 sm:h-14 rounded-xl bg-gradient-to-r from-[#5C2D91] to-[#7B3FA3] hover:from-[#4A2475] hover:to-[#5C2D91] text-white text-sm sm:text-base font-bold shadow-lg shadow-indigo-200/50 touch-manipulation">
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