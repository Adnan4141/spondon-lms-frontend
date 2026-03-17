'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

export default function StudentAllCoursesPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-2xl w-full rounded-[3rem] border-none bg-white p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
           <GraduationCap className="h-64 w-64 text-indigo-600" />
        </div>
        
        <CardContent className="relative z-10 space-y-8">
           <div className="h-24 w-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce duration-[3000ms]">
              <Sparkles className="h-12 w-12 text-indigo-600" />
           </div>
           
           <div className="space-y-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">সব কোর্স</h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
                 নতুন কোর্স দেখুন ও ভর্তি হোন
              </p>
           </div>

           <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/courses" 
                className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 group"
              >
                কোর্স দেখুন <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-slate-50 text-slate-600 font-black text-lg hover:bg-slate-100 transition-all">
                ক্যাটাগরি
              </button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
