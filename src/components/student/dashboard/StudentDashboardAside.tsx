import Link from 'next/link';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { statCardStyles } from './stat-card-styles';

export function StudentDashboardAside() {
  return (
    <div className="space-y-8">
      <Card className="rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardContent className="p-6">
          <h2 className="mb-6 text-xl font-black text-slate-900">Goals</h2>
          <div className="space-y-6">
            {[
              { label: 'Weekly study', progress: 75, color: 'indigo' as const },
              { label: 'Assignments', progress: 40, color: 'emerald' as const },
              { label: 'Quizzes', progress: 90, color: 'amber' as const },
            ].map((goal, idx) => {
              const st = statCardStyles[goal.color];
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-600">{goal.label}</span>
                    <span className={st.progressText}>{goal.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
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
            className="mt-8 block w-full rounded-2xl bg-slate-900 py-4 text-center text-sm font-black text-white shadow-xl shadow-slate-200 transition-colors hover:bg-slate-800"
          >
            View All
          </Link>
        </CardContent>
      </Card>

      <div className="group relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-indigo-50 p-8">
        <div className="relative z-10">
          <Star className="mb-4 h-10 w-10 text-indigo-600 transition-transform group-hover:rotate-12" />
          <h3 className="text-lg font-black text-indigo-900">Need help?</h3>
          <p className="mt-2 mb-6 text-sm font-medium text-indigo-600/80">
            Ask a question and get support from teachers.
          </p>
          <Link
            href="/student/doubts"
            className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
          >
            Ask a Question
          </Link>
        </div>
        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-indigo-200/50 blur-2xl" />
      </div>
    </div>
  );
}
