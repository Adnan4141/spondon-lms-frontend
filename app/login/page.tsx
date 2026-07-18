'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { login, resendLoginOtp, verifyLoginOtp, type LoginResponse } from '@/lib/api/auth';
import { getDeviceId } from '@/lib/device-id';
import { isTurnstileConfigured, TurnstileField } from '@/components/auth/TurnstileField';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { persistAuthSession, resolvePostLoginPath } from '@/lib/auth-session';

const TURNSTILE_REQUIRED = isTurnstileConfigured();
type LoginStep = 'credentials' | 'otp';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';
  const { toast, toasts, removeToast } = useToast();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileLoadError, setTurnstileLoadError] = useState(false);
  const [pendingLoginId, setPendingLoginId] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [formData, setFormData] = useState({
    identifier: '', // Now primarily mobile
    password: '',
  });

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileResetKey((k) => k + 1);
  };

  const isFormValid = useMemo(() => {
    const mobile = formData.identifier.trim();
    const baseValid = /^01[3-9]\d{8}$/.test(mobile) && formData.password.length >= 6;
    if (!baseValid) return false;
    if (TURNSTILE_REQUIRED) return Boolean(turnstileToken);
    return true;
  }, [formData, turnstileToken]);

  const canSubmitWithTurnstile = !TURNSTILE_REQUIRED || Boolean(turnstileToken);

  const finishLogin = (data: LoginResponse) => {
    toast({
      title: 'স্বাগতম!',
      description: `${data.user.fullName} হিসেবে আপনি সফলভাবে লগ ইন করেছেন।`,
      variant: 'success',
    });

    persistAuthSession(data);

    const target = resolvePostLoginPath(data.user, redirectTo);
    // Full navigation so middleware receives freshly set cookies on HTTPS production.
    window.setTimeout(() => {
      window.location.assign(target);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (TURNSTILE_REQUIRED && !turnstileToken) {
        toast({
          title: 'যাচাই প্রয়োজন',
          description: 'অনুগ্রহ করে নিরাপত্তা যাচাই সম্পন্ন করুন।',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsLoading(true);

    try {
      const mobile = formData.identifier.trim();
      const loginData = {
        mobile,
        password: formData.password,
        deviceId: getDeviceId(),
        ...(turnstileToken ? { turnstileToken } : {}),
      };

      const response = await login(loginData);

      if (response.success && response.requiresOtp && response.pendingLoginId) {
        setPendingLoginId(response.pendingLoginId);
        setMaskedMobile(response.maskedMobile || mobile);
        setOtpMessage(response.message || 'আপনার মোবাইলে পাঠানো OTP দিন।');
        setOtpCode('');
        setStep('otp');
        resetTurnstile();
        return;
      }

      if (response.success && response.data) {
        finishLogin(response.data);
      } else {
        if ((response as { requiresVerification?: boolean; mobile?: string }).requiresVerification) {
          setVerificationNeeded((response as { mobile?: string }).mobile || mobile);
          return;
        }
        resetTurnstile();
        toast({
          title: 'ব্যর্থ হয়েছে',
          description: response.message || 'আপনার তথ্যগুলো সঠিক নয়। আবার চেষ্টা করুন।',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      resetTurnstile();
      toast({
        title: 'ত্রুটি',
        description: error.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || !pendingLoginId) {
      toast({
        title: 'যাচাই প্রয়োজন',
        description: '৬ অঙ্কের OTP কোড দিন।',
        variant: 'destructive',
      });
      return;
    }
    if (!canSubmitWithTurnstile) {
      toast({
        title: 'যাচাই প্রয়োজন',
        description: 'অনুগ্রহ করে নিরাপত্তা যাচাই সম্পন্ন করুন।',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyLoginOtp({
        pendingLoginId,
        code: otpCode,
        deviceId: getDeviceId(),
        ...(turnstileToken ? { turnstileToken } : {}),
      });

      if (response.success && response.data) {
        finishLogin(response.data);
      } else {
        resetTurnstile();
        toast({
          title: 'ব্যর্থ হয়েছে',
          description: response.message || 'OTP যাচাই করা যায়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      resetTurnstile();
      toast({
        title: 'ত্রুটি',
        description: error instanceof Error ? error.message : 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingLoginId || !canSubmitWithTurnstile) return;
    setIsLoading(true);
    try {
      const response = await resendLoginOtp({
        pendingLoginId,
        deviceId: getDeviceId(),
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      if (response.success) {
        setOtpCode('');
        setMaskedMobile(response.maskedMobile || maskedMobile);
        toast({
          title: 'OTP পাঠানো হয়েছে',
          description: 'নতুন যাচাই কোড আপনার মোবাইলে পাঠানো হয়েছে।',
          variant: 'success',
        });
        resetTurnstile();
      } else {
        toast({
          title: 'ব্যর্থ হয়েছে',
          description: response.message || 'OTP পাঠানো যায়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'ত্রুটি',
        description: error instanceof Error ? error.message : 'OTP পাঠানো যায়নি।',
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
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF2D8C]/10 blur-[120px] rounded-full" />

        <div className="relative z-10 w-full max-w-md space-y-12">
          <Link href="/" className="inline-block transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Image src="/images/logo/mathlab.png" alt="Mathlab" width={443} height={512} className="object-contain h-14 w-auto" priority />
              <span className="text-3xl font-extrabold tracking-tight text-white">Mathlab</span>
            </div>
          </Link>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tighter">
              আপনার স্বপ্নের <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">যাত্রা শুরু হোক</span> <br />
              এখান থেকেই।
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
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2"><Image src="/images/logo/mathlab.png" alt="Mathlab" width={443} height={512} className="object-contain h-10 w-auto" /><span className="text-lg font-extrabold tracking-tight text-[#2B2E7A]">Mathlab</span></Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-10">
          <header className="space-y-4">
            <Link href="/" className="inline-flex items-center text-sm font-black text-slate-400 hover:text-[#5C2D91] transition-colors group uppercase tracking-widest">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              হোম পেজে ফিরে যান
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              {step === 'otp' ? 'ডিভাইস যাচাই' : 'লগ ইন করুন'}
            </h1>
            <p className="text-slate-500 font-bold text-lg">
              {step === 'otp'
                ? otpMessage || 'নিরাপত্তার জন্য আপনার মোবাইলে পাঠানো ৬ অঙ্কের কোড দিন।'
                : 'আপনার একাউন্টে প্রবেশ করতে নিচের তথ্যগুলো দিন।'}
            </p>
          </header>

          {step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">
                OTP পাঠানো হয়েছে: {maskedMobile || formData.identifier}
              </div>

              <div className="space-y-2">
                <label className={labelStyles}>যাচাই কোড (OTP)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="৬ অঙ্কের কোড"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 text-center text-2xl font-black tracking-[0.4em] border-2"
                />
              </div>

              {TURNSTILE_REQUIRED && (
                <TurnstileField
                  resetKey={turnstileResetKey}
                  onToken={(token) => {
                    setTurnstileLoadError(false);
                    setTurnstileToken(token);
                  }}
                  onError={() => setTurnstileLoadError(true)}
                />
              )}

              <Button
                type="submit"
                disabled={isLoading || otpCode.length !== 6 || !canSubmitWithTurnstile}
                className={cn(
                  'w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98]',
                  otpCode.length === 6 && !isLoading && canSubmitWithTurnstile
                    ? 'bg-[#5C2D91] hover:bg-[#4A2475] text-white shadow-indigo-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
                )}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>যাচাই করুন <ShieldCheck className="h-5 w-5 ml-2" /></>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setOtpCode('');
                    setPendingLoginId('');
                    resetTurnstile();
                  }}
                  className="text-slate-500 hover:text-[#5C2D91]"
                >
                  ← পাসওয়ার্ড ধাপে ফিরুন
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || !canSubmitWithTurnstile}
                  className="text-[#5C2D91] hover:underline disabled:opacity-50"
                >
                  OTP আবার পাঠান
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={labelStyles}>মোবাইল নম্বর</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                  <Input 
                    type="text" 
                    placeholder="০১৭XXXXXXXX" 
                    value={formData.identifier} 
                    onChange={(e) => setFormData(p => ({ ...p, identifier: e.target.value }))} 
                    className={inputStyles} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelStyles}>পাসওয়ার্ড</label>
                  <Link href="/forgot-password" title="Recover Password" className="text-[11px] font-black uppercase tracking-widest text-[#FF2D8C] hover:underline mb-2">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors" />
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} 
                    className={cn(inputStyles, "pr-12")} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {TURNSTILE_REQUIRED && (
              <div className="space-y-2">
                <TurnstileField
                  resetKey={turnstileResetKey}
                  onToken={(token) => {
                    setTurnstileLoadError(false);
                    setTurnstileToken(token);
                  }}
                  onError={() => setTurnstileLoadError(true)}
                />
                {turnstileLoadError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                    <p className="text-xs font-bold text-amber-800">
                      নিরাপত্তা যাচাই লোড হয়নি। Ad-blocker বন্ধ করে আবার চেষ্টা করুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTurnstileLoadError(false);
                        resetTurnstile();
                      }}
                      className="mt-1 text-xs font-black text-[#5C2D91] hover:underline"
                    >
                      আবার চেষ্টা করুন
                    </button>
                  </div>
                )}
              </div>
            )}

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
                <>লগ ইন করুন <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
          </form>
          )}

          {verificationNeeded ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3"
            >
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-800">আপনার মোবাইল নম্বর যাচাই করা হয়নি।</p>
                <Link
                  href={`/register?mobile=${encodeURIComponent(verificationNeeded)}&step=otp`}
                  className="inline-flex items-center gap-1.5 text-sm font-black text-[#5C2D91] hover:underline underline-offset-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  এখানে ক্লিক করে OTP দিয়ে যাচাই করুন →
                </Link>
              </div>
            </motion.div>
          ) : null}

          <footer className="text-center pt-4 border-t border-slate-100">
            <p className="text-slate-500 font-bold">
              একাউন্ট নেই? {' '}
              <Link href="/register" className="text-[#5C2D91] font-black hover:underline underline-offset-4 decoration-2">নতুন একাউন্ট খুলুন</Link>
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
