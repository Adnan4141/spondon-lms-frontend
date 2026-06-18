import Link from 'next/link';
import {
  BookOpen,
  BookMarked,
  Award,
  BookOpenCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from './types';
import { statCardStyles } from './stat-card-styles';

type Props = {
  stats: DashboardStats;
};

export function StudentDashboardStatsGrid({ stats }: Props) {
  const statItems = [
    {
      label: 'Courses',
      value: stats.myCourses,
      icon: BookOpen,
      color: 'indigo' as const,
      href: '/student/courses',
    },
    {
      label: 'Book Orders',
      value: stats.myBooks,
      icon: BookMarked,
      color: 'violet' as const,
      href: '/student/books#my-books',
    },
    {
      label: 'Exams',
      value: stats.myExams,
      icon: BookOpenCheck,
      color: 'sky' as const,
      href: '/student/exams',
    },
    {
      label: 'Results',
      value: stats.results,
      icon: Award,
      color: 'amber' as const,
      href: '/student/results',
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        const styles = statCardStyles[item.color];
        const inner = (
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div
                className={`rounded-2xl p-3 ${styles.iconWrap} transition-transform duration-500 group-hover:scale-110`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current</span>
            </div>
            <div className="mt-5">
              <h3 className="text-3xl font-black text-slate-900">{item.value}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">{item.label}</p>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
              <Icon className="h-16 w-16" />
            </div>
          </CardContent>
        );
        return (
          <Link key={idx} href={item.href} className="block">
            <Card className="group relative overflow-hidden rounded-3xl border-none bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
              {inner}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
