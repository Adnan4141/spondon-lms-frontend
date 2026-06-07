'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { forgotPassword, verifyForgotPasswordOtp, resetPassword, resendOtp } from '@/lib/api/auth';
import { isTurnstileConfigured, TurnstileField } from '@/components/auth/TurnstileField';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const TURNSTILE_REQUIRED = isTurnstileConfigured();

type Step = 'mobile' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputStyles = 'h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2';
  const labelStyles = 'text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block';

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileResetKey((k) => k + 1);
  };

  const canSubmitWithTurnstile = useMemo(() => {
    if (!TURNSTILE_REQUIRED) return true;
    return Boolean(turnstileToken);
  }, [turnstileToken]);

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!/^01[3-9]\d{8}$/.test(mobile.trim())) {
      toast({ title: 'ভুল নম্বর', description: 'সঠিক মোবাইল নম্বর প্রদান করুন।', variant: 'destructive' });
      return;
    }
    if (!canSubmitWithTurnstile) {
      toast({ title: 'যাচাই প্রয়োজন', description: 'অনুগ্রহ করে নিরাপত্তা যাচাই সম্পন্ন করুন।', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword({
        mobile: mobile.trim(),
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      if (res.success) {
        setOtpVerified(false);
        setResetToken('');
        setStep('otp');
        startResendCooldown();
        resetTurnstile();
        toast({ title: 'কোড পাঠানো হয়েছে', description: 'আপনার মোবাইলে একটি যাচাই কোড পাঠানো হয়েছে।', variant: 'success' });
      } else {
        resetTurnstile();
        toast({ title: 'ব্যর্থ হয়েছে', description: res.message, variant: 'destructive' });
      }
    } catch {
      resetTurnstile();
      toast({ title: 'ত্রুটি', description: 'কোড পাঠানো সম্ভব হয়নি।', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (otpCode.length !== 6) {
      toast({ title: 'ভুল কোড', description: '৬ সংখ্যার কোডটি প্রবেশ করুন।', variant: 'destructive' });
      return;
    }
    if (!canSubmitWithTurnstile) {
      toast({ title: 'যাচাই প্রয়োজন', description: 'অনুগ্রহ করে নিরাপত্তা যাচাই সম্পন্ন করুন।', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyForgotPasswordOtp({
        mobile: mobile.trim(),
        code: otpCode,
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      if (res.success && res.data?.verified) {
        setOtpVerified(true);
        if (res.data.resetToken) setResetToken(res.data.resetToken);
        setStep('password');
        resetTurnstile();
        toast({ title: 'যাচাই সম্পন্ন!', description: 'এখন নতুন পাসওয়ার্ড সেট করুন।', variant: 'success' });
      } else {
        resetTurnstile();
        toast({
          title: 'ব্যর্থ হয়েছে',
          description: res.message || 'কোডটি সঠিক নয় অথবা মেয়াদ শেষ হয়েছে।',
          variant: 'destructive',
        });
      }
    } catch {
      resetTurnstile();
      toast({ title: 'ত্রুটি', description: 'যাচাই করা সম্ভব হয়নি।', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (newPassword.length < 6) {
      toast({ title: 'দুর্বল পাসওয়ার্ড', description: 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'পাসওয়ার্ড মেলেনি', description: 'উভয় পাসওয়ার্ড একই হতে হবে।', variant: 'destructive' });
      return;
    }

    if (!otpVerified) {
      toast({ title: 'সেশন শেষ', description: 'আবার যাচাই কোড দিন।', variant: 'destructive' });
      setStep('otp');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword({
        newPassword,
        ...(resetToken ? { resetToken } : {}),
      });
      if (res.success) {
        toast({ title: 'পাসওয়ার্ড পরিবর্তন হয়েছে!', description: 'এখন নতুন পাসওয়ার্ড দিয়ে লগ ইন করুন।', variant: 'success' });
        setTimeout(() => router.push('/login'), 1800);
      } else {
        toast({ title: 'ব্যর্থ হয়েছে', description: res.message || 'সেশনের মেয়াদ শেষ হয়েছে। আবার যাচাই করুন।', variant: 'destructive' });
        setOtpVerified(false);
        setResetToken('');
        setOtpCode('');
        setStep('otp');
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি।', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    if (!canSubmitWithTurnstile) {
      toast({ title: 'যাচাই প্রয়োজন', description: 'অনুগ্রহ করে নিরাপত্তা যাচাই সম্পন্ন করুন।', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await resendOtp({
        mobile: mobile.trim(),
        purpose: 'FORGOT_PASSWORD',
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      if (res.success) {
        setOtpVerified(false);
        setResetToken('');
        setOtpCode('');
        resetTurnstile();
        toast({ title: 'কোড পুনরায় পাঠানো হয়েছে', variant: 'success' });
        startResendCooldown();
      } else {
        resetTurnstile();
        toast({ title: 'ব্যর্থ', description: res.message, variant: 'destructive' });
      }
    } catch {
      resetTurnstile();
      toast({ title: 'কোড পাঠানো সম্ভব হয়নি', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels: Record<Step, string> = {
    mobile: '১',
    otp: '২',
    password: '৩',
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      <Toaster toasts={toasts} removeToast={removeToast} />

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#0F172A] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5C2D91] via-[#0F172A] to-[#0F172A] opacity-90" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF2D8C]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="relative z-10 w-full max-w-md space-y-10">
          <Link href="/" className="inline-block transform hover:scale-105 transition-transform">
            <div className="relative h-14 w-48">
              <Image src="/images/logo/spondon-logo.png" alt="Spondon" fill sizes="192px" className="object-contain brightness-0 invert" priority />
            </div>
          </Link>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight tracking-tighter">
              পাসওয়ার্ড ভুলে গেছেন?
            </h2>
            <p className="text-slate-300 font-bold text-lg leading-relaxed">
              চিন্তা নেই। আপনার মোবাইল নম্বরে একটি যাচাই কোড পাঠিয়ে নতুন পাসওয়ার্ড সেট করুন।
            </p>
          </div>
          {/* Step indicators */}
          <div className="space-y-3">
            {[
              { key: 'mobile', label: 'মোবাইল নম্বর দিন' },
              { key: 'otp', label: 'যাচাই কোড দিন' },
              { key: 'password', label: 'নতুন পাসওয়ার্ড দিন' },
            ].map(({ key, label }, i) => {
              const isActive = step === key;
              const isDone =
                (key === 'mobile' && (step === 'otp' || step === 'password')) ||
                (key === 'otp' && step === 'password');
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all',
                    isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-white text-[#5C2D91]' : 'bg-white/10 text-slate-400',
                  )}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <p className={cn('font-bold text-sm', isActive ? 'text-white' : 'text-slate-400')}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative overflow-y-auto no-scrollbar">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/"><Image src="/images/logo/spondon-logo.png" alt="Logo" width={120} height={40} className="object-contain" /></Link>
        </div>

        <div className="w-full max-w-xl py-12">
          <AnimatePresence mode="wait">

            {/* Step 1: Mobile */}
            {step === 'mobile' && (
              <motion.div key="mobile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                <header className="space-y-4">
                  <Link href="/login" className="inline-flex items-center text-sm font-black text-slate-400 hover:text-[#5C2D91] transition-colors group uppercase tracking-widest">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    লগ ইনে ফিরুন
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
                      <Phone className="h-7 w-7 text-[#5C2D91]" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tighter">মোবাইল নম্বর দিন</h1>
                      <p className="text-slate-500 font-bold text-sm mt-1">নিবন্ধিত নম্বরে যাচাই কোড পাঠানো হবে</p>
                    </div>
                  </div>
                </header>

                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className={labelStyles}>মোবাইল নম্বর</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="017XXXXXXXX"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        className={inputStyles}
                        autoFocus
                      />
                    </div>
                  </div>

                  <TurnstileField
                    resetKey={turnstileResetKey}
                    onToken={setTurnstileToken}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading || !/^01[3-9]\d{8}$/.test(mobile) || !canSubmitWithTurnstile}
                    className={cn(
                      'w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3',
                      /^01[3-9]\d{8}$/.test(mobile) && canSubmitWithTurnstile ? 'bg-[#5C2D91] hover:bg-[#4A2475] text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
                    )}
                  >
                    {isLoading ? <div className="h-5 w-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : <>কোড পাঠান <ShieldCheck className="h-5 w-5" /></>}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                <header className="space-y-4">
                  <button
                    type="button"
                    onClick={() => { setOtpVerified(false); setResetToken(''); setOtpCode(''); resetTurnstile(); setStep('mobile'); }}
                    className="inline-flex items-center text-sm font-black text-slate-400 hover:text-[#5C2D91] transition-colors group uppercase tracking-widest"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    ফিরে যান
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
                      <ShieldCheck className="h-7 w-7 text-[#5C2D91]" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tighter">যাচাই কোড দিন</h1>
                      <p className="text-slate-500 font-bold text-sm mt-1">
                        <span className="text-[#5C2D91] font-black">{mobile}</span> নম্বরে কোড পাঠানো হয়েছে
                      </p>
                    </div>
                  </div>
                </header>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className={labelStyles}>যাচাই কোড</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="৬ সংখ্যার কোড"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={cn(inputStyles, 'tracking-[0.5em] text-center text-xl')}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold ml-1">কোডটি ১০ মিনিটের মধ্যে ব্যবহার করুন।</p>
                  </div>

                  <TurnstileField
                    resetKey={turnstileResetKey}
                    onToken={setTurnstileToken}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6 || !canSubmitWithTurnstile}
                    className={cn(
                      'w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3',
                      otpCode.length === 6 && !isLoading && canSubmitWithTurnstile ? 'bg-[#5C2D91] hover:bg-[#4A2475] text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
                    )}
                  >
                    {isLoading ? <div className="h-5 w-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : 'যাচাই করুন'}
                  </Button>
                </form>

                <div className="text-center space-y-3">
                  <p className="text-slate-500 font-bold text-sm">কোড পাননি?</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className={cn(
                      'inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-colors',
                      resendCooldown > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-[#5C2D91] hover:text-[#4A2475]',
                    )}
                  >
                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    {resendCooldown > 0 ? `পুনরায় পাঠান (${resendCooldown}s)` : 'পুনরায় পাঠান'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                <header className="space-y-4">
                  <button
                    type="button"
                    onClick={() => { setOtpVerified(false); setResetToken(''); resetTurnstile(); setStep('otp'); }}
                    className="inline-flex items-center text-sm font-black text-slate-400 hover:text-[#5C2D91] transition-colors group uppercase tracking-widest"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    ফিরে যান
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
                      <KeyRound className="h-7 w-7 text-[#5C2D91]" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tighter">নতুন পাসওয়ার্ড দিন</h1>
                      <p className="text-slate-500 font-bold text-sm mt-1">শক্তিশালী পাসওয়ার্ড বেছে নিন</p>
                    </div>
                  </div>
                </header>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className={labelStyles}>নতুন পাসওয়ার্ড</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={cn(inputStyles, 'pr-12', newPassword.length > 0 && (newPassword.length < 6 ? 'border-rose-200' : 'border-emerald-200'))}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <p className={cn('text-[13px] font-black uppercase tracking-wider ml-1 flex items-center gap-1', newPassword.length < 6 ? 'text-rose-500' : 'text-emerald-500')}>
                          {newPassword.length < 6 ? 'অন্তত ৬ অক্ষর প্রয়োজন' : 'পাসওয়ার্ড সঠিক'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={labelStyles}>পুনরায় লিখুন</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                        <Input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={cn(inputStyles, 'pr-12', confirmPassword.length > 0 && (newPassword !== confirmPassword ? 'border-rose-200' : 'border-emerald-200'))}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
                        <p className={cn('text-[13px] font-black uppercase tracking-wider ml-1 flex items-center gap-1', newPassword !== confirmPassword ? 'text-rose-500' : 'text-emerald-500')}>
                          {newPassword !== confirmPassword ? 'পাসওয়ার্ড মেলেনি' : 'পাসওয়ার্ড মিলেছে'}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className={cn(
                      'w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3',
                      newPassword.length >= 6 && newPassword === confirmPassword
                        ? 'bg-[#5C2D91] hover:bg-[#4A2475] text-white shadow-indigo-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
                    )}
                  >
                    {isLoading ? <div className="h-5 w-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : <>পাসওয়ার্ড পরিবর্তন করুন <CheckCircle2 className="h-5 w-5" /></>}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
