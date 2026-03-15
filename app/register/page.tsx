'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User,
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Phone,
  ArrowLeft,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { register } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    gender: 'MALE',
    password: '',
    confirmPassword: '',
  });

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.fullName.trim().length >= 3 &&
      /^01[3-9]\d{8}$/.test(formData.mobile) &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  }, [formData]);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!isFormValid) {
      if (formData.password !== formData.confirmPassword) {
        toast({ title: 'পাসওয়ার্ড মেলেনি', description: 'উভয় পাসওয়ার্ড একই হতে হবে।', variant: 'destructive' });
      } else if (formData.password.length < 6) {
        toast({ title: 'দুর্বল পাসওয়ার্ড', description: 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।', variant: 'destructive' });
      } else if (!/^01[3-9]\d{8}$/.test(formData.mobile)) {
        toast({ title: 'ভুল নম্বর', description: 'সঠিক মোবাইল নম্বর প্রদান করুন।', variant: 'destructive' });
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        fullName: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        gender: formData.gender,
        password: formData.password,
        role: 'STUDENT',
      });

      if (response.success) {
        toast({
          title: 'অভিনন্দন!',
          description: 'আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।',
          variant: 'success',
        });

        // Reset Form
        setFormData({
          fullName: '',
          mobile: '',
          gender: 'MALE',
          password: '',
          confirmPassword: '',
        });

        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast({
          title: 'ব্যর্থ হয়েছে',
          description: response.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'একটি অপ্রত্যাশিত সমস্যা হয়েছে।';

      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2";
  const labelStyles = "text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block";

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      <Toaster toasts={toasts} removeToast={removeToast} />

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#0F172A] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5C2D91] via-[#0F172A] to-[#0F172A] opacity-90" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF2D8C]/10 blur-[120px] rounded-full animate-pulse" />

        <div className="relative z-10 w-full max-w-md space-y-12">
          <Link href="/" className="inline-block transform hover:scale-105 transition-transform">
            <div className="relative h-14 w-48">
              <Image src="/images/logo/spondon-logo.png" alt="Spondon" fill className="object-contain brightness-0 invert" priority />
            </div>
          </Link>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tighter">
              আপনার স্বপ্নের <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">নতুন পথচলা</span> <br />
              শুরু হোক আজই।
            </h2>
            <div className="space-y-4 pt-4">
              {['সেরা মেন্টরদের তত্ত্বাবধানে পূর্ণাঙ্গ প্রস্তুতি', 'আধুনিক প্রযুক্তিনির্ভর লার্নিং ম্যানেজমেন্ট', 'সারা দেশে বিস্তৃত ব্রাঞ্চ নেটওয়ার্ক'].map((text, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center gap-4 text-slate-300">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <p className="font-bold text-lg">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative overflow-y-auto no-scrollbar">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/"><Image src="/images/logo/spondon-logo.png" alt="Logo" width={120} height={40} className="object-contain" /></Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl space-y-10 py-12">
          <header className="space-y-4">
            <Link href="/login" className="inline-flex items-center text-sm font-black text-slate-400 hover:text-[#5C2D91] transition-colors group uppercase tracking-widest">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              লগ ইন এ ফিরে যান
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">রেজিস্ট্রেশন করুন</h1>
            <p className="text-slate-500 font-bold text-lg">নিচের তথ্যগুলো দিয়ে আপনার একাউন্টটি সুরক্ষিত করুন।</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Gender */}
              <div className="sm:col-span-2 space-y-2">
                <label className={labelStyles}>আপনি একজন</label>
                <div className="grid grid-cols-2 gap-4">
                  {[{ id: 'MALE', label: 'ছাত্র', icon: User }, { id: 'FEMALE', label: 'ছাত্রী', icon: UserCheck }].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, gender: g.id }))}
                      className={cn(
                        "flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all active:scale-95 font-black text-lg",
                        formData.gender === g.id ? "border-[#5C2D91] bg-indigo-50/50 text-[#5C2D91] shadow-lg" : "border-slate-100 bg-slate-50/30 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <g.icon className="h-5 w-5" />
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2 sm:col-span-2">
                <label className={labelStyles}>পুরো নাম</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                  <Input 
                    type="text" 
                    placeholder="আপনার পুরো নাম" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} 
                    className={inputStyles} 
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="space-y-2 sm:col-span-2">
                <label className={labelStyles}>মোবাইল নম্বর</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                  <Input 
                    type="tel" 
                    placeholder="017XXXXXXXX"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.mobile} 
                    onChange={(e) => setFormData(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))} 
                    className={inputStyles} 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className={labelStyles}>পাসওয়ার্ড</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} 
                    className={cn(inputStyles, "pr-12", formData.password.length > 0 && (formData.password.length < 6 ? "border-rose-200 focus:ring-rose-500/10" : "border-emerald-200 focus:ring-emerald-500/10"))} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password.length > 0 && (
                  <p className={cn("text-[10px] font-black uppercase tracking-wider ml-1 mt-1 flex items-center gap-1", formData.password.length < 6 ? "text-rose-500" : "text-emerald-500")}>
                    {formData.password.length < 6 ? <><span className="h-1 w-1 rounded-full bg-rose-500" /> পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে</> : <><span className="h-1 w-1 rounded-full bg-emerald-500" /> পাসওয়ার্ডের দৈর্ঘ্য সঠিক আছে</>}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className={labelStyles}>পুনরায় লিখুন</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                  <Input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={formData.confirmPassword} 
                    onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} 
                    className={cn(inputStyles, "pr-12", formData.confirmPassword.length > 0 && (formData.password !== formData.confirmPassword ? "border-rose-200 focus:ring-rose-500/10" : "border-emerald-200 focus:ring-emerald-500/10"))} 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && (
                  <p className={cn("text-[10px] font-black uppercase tracking-wider ml-1 mt-1 flex items-center gap-1", formData.password !== formData.confirmPassword ? "text-rose-500" : "text-emerald-500")}>
                    {formData.password !== formData.confirmPassword ? <><span className="h-1 w-1 rounded-full bg-rose-500" /> পাসওয়ার্ড মেলেনি</> : <><span className="h-1 w-1 rounded-full bg-emerald-500" /> পাসওয়ার্ড মিলেছে</>}
                  </p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid}
              className={cn(
                "w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3",
                isFormValid ? "bg-[#5C2D91] hover:bg-[#4A2475] text-white shadow-indigo-100" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>একাউন্ট তৈরি করুন <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
          </form>

          <footer className="text-center">
            <p className="text-slate-500 font-bold">
              ইতিমধ্যেই একাউন্ট আছে? {' '}
              <Link href="/login" className="text-[#5C2D91] font-black hover:underline underline-offset-4 decoration-2">লগ ইন করুন</Link>
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}