'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, BookMarked, GraduationCap, Award, ArrowRight, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getMyCourses, getMyBookPurchases } from '@/lib/api/student-portal';
import { MyBookPurchasesPanel, type MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState({ myCourses: 0, myBooks: 0, results: 0, hoursLearned: 0 });
  const [user, setUser] = useState<{ fullName?: string } | null>(null);
  const [myPurchases, setMyPurchases] = useState<MyBookPurchaseRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUser(parsed);
        if (parsed?.id) {
          getMyCourses(parsed.id).then((r) => {
            if (r.success && r.data) setStats((s) => ({ ...s, myCourses: r.data!.length }));
          }).catch(() => {});
          getMyBookPurchases(parsed.id)
            .then((r) => {
              if (r.success && r.data) {
                setMyPurchases(r.data);
                setStats((s) => ({ ...s, myBooks: r.data!.length }));
              }
            })
            .catch(() => {})
            .finally(() => setPurchasesLoading(false));
        } else {
          setPurchasesLoading(false);
        }
      } catch {
        setPurchasesLoading(false);
      }
    } else {
      setPurchasesLoading(false);
    }
  }, []);

  const userName = user?.fullName || 'শিক্ষার্থী';

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">আসসালামু আলাইকুম, {userName}! 👋</h1>
            <p className="text-indigo-100 text-lg font-medium max-w-md">
              কোর্স দেখুন, রুটিন মেনে চলুন।
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/student/courses" className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg">
                আমার কোর্স দেখুন
              </Link>
              <Link href="/student/books#my-books" className="px-6 py-3 bg-white/15 text-white border border-white/25 rounded-2xl font-bold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm">
                আমার বই
              </Link>
              <Link href="/student/routine" className="px-6 py-3 bg-indigo-500/30 text-white border border-indigo-400/30 rounded-2xl font-bold text-sm hover:bg-indigo-500/40 transition-colors backdrop-blur-sm">
                রুটিন দেখুন
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative h-48 w-48 flex items-center justify-center">
              <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-white/10 rounded-full animate-ping" />
              <GraduationCap className="h-24 w-24 text-white relative z-10" />
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'কোর্স', value: stats.myCourses, icon: BookOpen, color: 'indigo', href: '/student/courses' },
          { label: 'বই অর্ডার', value: stats.myBooks, icon: BookMarked, color: 'violet', href: '/student/books#my-books' },
          { label: 'সময়', value: stats.hoursLearned, icon: Clock, color: 'emerald' },
          { label: 'ফলাফল', value: stats.results, icon: Award, color: 'amber', href: '/student/results' },
        ].map((item, idx) => (
          <Card key={idx} className="group relative overflow-hidden rounded-3xl border-none bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">বর্তমান</span>
              </div>
              <div className="mt-5">
                <h3 className="text-3xl font-black text-slate-900">{item.value}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">{item.label}</p>
              </div>
              <div className={`absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <item.icon className="h-16 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black text-slate-900">আমার বই ও অর্ডার</h2>
          <Link
            href="/student/books#my-books"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
          >
            সব দেখুন →
          </Link>
        </div>
        <MyBookPurchasesPanel
          purchases={myPurchases.slice(0, 3)}
          loading={purchasesLoading}
          compact
        />
        {myPurchases.length > 3 ? (
          <p className="text-center text-sm font-bold text-slate-500">
            <Link href="/student/books#my-books" className="text-indigo-600 hover:underline">
              আরও {myPurchases.length - 3} টি অর্ডার
            </Link>
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">সাম্প্রতিক কাজ</h2>
            <Link href="/student/courses" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              সব দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid gap-4">
            {stats.myCourses === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-100 text-center">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="font-bold text-slate-600">কোনো কোর্সে ভর্তি হননি</p>
                <Link href="/student/all-courses" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700">
                  কোর্স দেখুন
                </Link>
              </div>
            ) : (
              [1, 2, 3].slice(0, Math.min(3, stats.myCourses)).map((i) => (
                <Link key={i} href="/student/courses" className="group flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 truncate">আমার কোর্স</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> চলমান</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-emerald-600 font-bold">চালিয়ে যান</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Sidebar content */}
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardContent className="p-6">
              <h2 className="text-xl font-black text-slate-900 mb-6">লক্ষ্য</h2>
              <div className="space-y-6">
                {[
                  { label: 'সাপ্তাহিক পড়া', progress: 75, color: 'indigo' },
                  { label: 'কাজ', progress: 40, color: 'emerald' },
                  { label: 'কুইজ', progress: 90, color: 'amber' },
                ].map((goal, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-600">{goal.label}</span>
                      <span className={`text-${goal.color}-600`}>{goal.progress}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${goal.color}-500 rounded-full transition-all duration-1000`} 
                        style={{ width: `${goal.progress}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/student/courses" className="block w-full mt-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200 text-center">
                সব দেখুন
              </Link>
            </CardContent>
          </Card>

          <div className="rounded-[2rem] bg-indigo-50 p-8 border border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <Star className="h-10 w-10 text-indigo-600 mb-4 group-hover:rotate-12 transition-transform" />
              <h3 className="text-lg font-black text-indigo-900">সাহায্য চাই?</h3>
              <p className="text-sm text-indigo-600/80 font-medium mt-2 mb-6">
                প্রশ্ন থাকলে এখানে জিজ্ঞাসা করুন।
              </p>
              <Link href="/student/doubts" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors">
                প্রশ্ন করুন
              </Link>
            </div>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-indigo-200/50 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
