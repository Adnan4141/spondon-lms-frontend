import Link from 'next/link';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { statCardStyles } from './stat-card-styles';

export function StudentDashboardAside() {
  return (
    <div className="space-y-8">
      <Card className="rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardContent className="p-6">
          <h2 className="text-xl font-black text-slate-900 mb-6">লক্ষ্য</h2>
          <div className="space-y-6">
            {[
              { label: 'সাপ্তাহিক পড়া', progress: 75, color: 'indigo' as const },
              { label: 'কাজ', progress: 40, color: 'emerald' as const },
              { label: 'কুইজ', progress: 90, color: 'amber' as const },
            ].map((goal, idx) => {
              const st = statCardStyles[goal.color];
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-600">{goal.label}</span>
                    <span className={st.progressText}>{goal.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.progressBar} rounded-full transition-all duration-1000`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/student/courses"
            className="block w-full mt-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200 text-center"
          >
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
          <Link
            href="/student/doubts"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors"
          >
            প্রশ্ন করুন
          </Link>
        </div>
        <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-indigo-200/50 rounded-full blur-2xl" />
      </div>
    </div>
  );
}
