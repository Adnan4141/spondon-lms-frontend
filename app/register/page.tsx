'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Phone,
  ArrowLeft
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
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    gender: 'MALE',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.mobile || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        gender: formData.gender,
        password: formData.password,
        role: 'STUDENT', // Default to student
      };

      const response = await register(registerData);

      if (response.success) {
        toast({
          title: 'Registration Successful!',
          description: 'Your account has been created. Please log in.',
          variant: 'success',
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast({
          title: 'Registration Failed',
          description: response.message || 'Something went wrong. Please try again.',
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
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5C2D91]/80 via-[#0F172A]/90 to-[#0F172A]" />
        </div>

        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF2D8C]/10 blur-[120px] rounded-full" />
        </div>

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
                আমাদের সাথে <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">নতুন পথচলা</span> <br />
                শুরু করুন।
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="space-y-6"
            >
              {[
                'সহজ এবং দ্রুত রেজিস্ট্রেশন প্রক্রিয়া',
                'সকল কোর্সে এক্সেস এবং আপডেট',
                'পার্সোনালাইজড ড্যাশবোর্ড',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 text-slate-300">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="font-medium text-lg">{feature}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- Right Side: Register Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:py-12 lg:px-24 relative">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/">
            <Image src="/images/logo/spondon-logo.png" alt="Logo" width={120} height={40} className="object-contain" />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-[#5C2D91] transition-colors mb-2 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              হোম পেজে ফিরে যান
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">রেজিস্ট্রেশন করুন</h1>
            <p className="text-slate-500 font-medium">নতুন একাউন্ট খুলতে নিচের তথ্যগুলো দিন।</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[15px] mb-2 font-black uppercase tracking-widest text-slate-400 ml-2">
                  পুরো নাম
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <Input 
                    type="text"
                    placeholder="আপনার পুরো নাম লিখুন"
                    value={formData.fullName}
                    onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                    className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[15px] mb-2 font-black uppercase tracking-widest text-slate-400 ml-2">
                  মোবাইল নম্বর
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <Input 
                    type="text"
                    placeholder="০১৭XXXXXXXX"
                    value={formData.mobile}
                    onChange={(e) => setFormData(p => ({ ...p, mobile: e.target.value }))}
                    className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[15px] mb-2 font-black uppercase tracking-widest text-slate-400 ml-2">
                  আপনি একজন
                </label>
                <div className="grid grid-cols-2  mt-2 gap-4">
                  {[
                    { id: 'MALE', label: 'ছাত্র' },
                    { id: 'FEMALE', label: 'ছাত্রী' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, gender: g.id }))}
                      className={cn(
                        "flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all active:scale-95",
                        formData.gender === g.id 
                          ? "border-[#5C2D91] bg-indigo-50/50 text-[#5C2D91] shadow-lg shadow-indigo-100/50" 
                          : "border-slate-100 bg-slate-50/30 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <span className="text-base font-black">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[15px] mb-2 font-black uppercase tracking-widest text-slate-400 ml-2">
                    পাসওয়ার্ড
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                      className="h-12 pl-12 pr-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[15px] mb-2 font-black uppercase tracking-widest text-slate-400 ml-2">
                    পুনরায় লিখুন
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5C2D91] transition-colors">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                      className="h-12 pl-12 pr-12 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-[#5C2D91] hover:bg-[#4A2475] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  প্রসেসিং হচ্ছে...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  একাউন্ট খুলুন
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-slate-500 font-medium pt-2">
            ইতিমধ্যেই একাউন্ট আছে? {' '}
            <Link href="/login" className="text-[#5C2D91] font-black hover:underline">
              লগ ইন করুন
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
