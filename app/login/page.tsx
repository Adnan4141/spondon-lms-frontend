'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Chrome,
  Github,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { login } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // Email or Mobile
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.identifier || !formData.password) {
        toast({
          title: 'Validation Error',
          description: 'Please enter both your identifier and password.',
          variant: 'destructive',
        });
        return;
      }

      // Payload logic: determine if identifier is email or mobile
      const isEmail = formData.identifier.includes('@');
      const loginData = {
        [isEmail ? 'email' : 'mobile']: formData.identifier,
        password: formData.password,
      };

      const response = await login(loginData);

      if (response.success && response.data) {
        toast({
          title: 'Welcome Back!',
          description: `Successfully logged in as ${response.data.user.fullName}`,
          variant: 'success',
        });
        
        // Save token to localStorage (simple implementation)
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on role
        setTimeout(() => {
          const user = (response.data as any)?.user;
          if (user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN') {
            router.push('/admin/dashboard');
          } else {
            router.push('/student/dashboard');
          }
        }, 1500);
      } else {
        toast({
          title: 'Login Failed',
          description: response.message || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      <Toaster toasts={toasts} removeToast={removeToast} />
      
      {/* --- Left Side: Aesthetic Background & Branding --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F172A] items-center justify-center p-12">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0">
     
          <div className="absolute inset-0 bg-gradient-to-br from-[#5C2D91]/80 via-[#0F172A]/90 to-[#0F172A]" />
        </div>

        {/* Animated Patterns */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF2D8C]/10 blur-[120px] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg w-full space-y-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative h-12 w-40">
                <Image
                  src="/images/logo/spondon-logo.png"
                  alt="Spondon Logo"
                  fill
                  className="object-contain brightness-0 invert"
                  priority
                />
              </div>
            </Link>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">
                আপনার স্বপ্নের <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">যাত্রা শুরু হোক</span> <br />
                এখান থেকেই।
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="space-y-6"
            >
              {[
                'সেরা মেন্টরদের তত্ত্বাবধানে পূর্ণাঙ্গ প্রস্তুতি',
                'আধুনিক প্রযুক্তিনির্ভর লার্নিং ম্যানেজমেন্ট সিস্টেম',
                'সারা দেশে বিস্তৃত ব্রাঞ্চ নেটওয়ার্ক',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 text-slate-300">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="font-medium text-lg">{feature}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-8 border-t border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0F172A] bg-slate-800 relative overflow-hidden">
                    <Image src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" fill />
                  </div>
                ))}
              </div>
              <p className="text-slate-400 font-medium">
                <span className="text-white font-bold">৩০ লক্ষ+</span> শিক্ষার্থী আমাদের সাথে যুক্ত
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- Right Side: Login Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/">
            <Image src="/images/logo/spondon-logo.png" alt="Logo" width={120} height={40} className="object-contain" />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-10"
        >
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-[#5C2D91] transition-colors mb-4 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              হোম পেজে ফিরে যান
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">লগ ইন করুন</h1>
            <p className="text-slate-500 font-medium">আপনার একাউন্টে প্রবেশ করতে নিচের তথ্যগুলো দিন।</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  ইমেইল অথবা মোবাইল নম্বর
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input 
                    type="text"
                    placeholder="example@gmail.com"
                    value={formData.identifier}
                    onChange={(e) => setFormData(p => ({ ...p, identifier: e.target.value }))}
                    className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    পাসওয়ার্ড
                  </label>
                  <Link href="/forgot-password" title="Recover Password" className="text-[11px] font-black uppercase tracking-widest text-[#FF2D8C] hover:underline">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="h-14 pl-12 pr-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-[#5C2D91] hover:bg-[#4A2475] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  প্রসেসিং হচ্ছে...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  লগ ইন করুন
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-400">অথবা সামাজিক যোগাযোগ মাধ্যম দিয়ে</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 h-14 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm">
              <Chrome className="h-5 w-5 text-red-500" />
              Google
            </button>
            <button className="flex items-center justify-center gap-3 h-14 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm">
              <Phone className="h-5 w-5 text-indigo-500" />
              Mobile OTP
            </button>
          </div>

          <p className="text-center text-slate-500 font-medium">
            একাউন্ট নেই? {' '}
            <Link href="/register" className="text-[#5C2D91] font-black hover:underline">
              নতুন একাউন্ট খুলুন
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
