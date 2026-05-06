import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { StudentChangePasswordDialog } from '@/components/student/StudentChangePasswordDialog';

type Props = {
  userName: string;
};

export function StudentDashboardWelcomeBanner({ userName }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-white shadow-2xl shadow-indigo-200">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">আসসালামু আলাইকুম, {userName}! 👋</h1>
          <p className="text-indigo-100 text-lg font-medium max-w-md">
            কোর্স দেখুন, পরীক্ষা দিন, রুটিন মেনে চলুন।
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/student/courses"
              className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
            >
              আমার কোর্স দেখুন
            </Link>
            <Link
              href="/student/exams"
              className="px-6 py-3 bg-white/15 text-white border border-white/25 rounded-2xl font-bold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              পরীক্ষা দেখুন
            </Link>
            <Link
              href="/student/books#my-books"
              className="px-6 py-3 bg-white/15 text-white border border-white/25 rounded-2xl font-bold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              আমার বই
            </Link>
            <Link
              href="/student/routine"
              className="px-6 py-3 bg-indigo-500/30 text-white border border-indigo-400/30 rounded-2xl font-bold text-sm hover:bg-indigo-500/40 transition-colors backdrop-blur-sm"
            >
              রুটিন দেখুন
            </Link>
            <StudentChangePasswordDialog />
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
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
    </div>
  );
}
