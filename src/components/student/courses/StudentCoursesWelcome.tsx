'use client';

import { useEffect, useState } from 'react';
import { Award, Compass, Play } from 'lucide-react';

type Props = {
  stats: {
    inProgress: number;
    completed: number;
  };
  total: number;
};

export function StudentCoursesWelcome({ stats, total }: Props) {
  const [studentName, setStudentName] = useState('Student');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.fullName) {
            setStudentName(user.fullName);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
      {/* Background radial glows */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Mesh Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Welcome back, {studentName}! 👋
          </h2>
          <p className="max-w-md text-sm font-semibold text-slate-300 leading-relaxed">
            Ready to learn something new today? Keep momentum high and check your active courses below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Compass className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled</p>
              <p className="text-lg font-black leading-none mt-0.5">{total}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
              <Play className="h-4.5 w-4.5 fill-current" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active</p>
              <p className="text-lg font-black leading-none mt-0.5">{stats.inProgress}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <Award className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
              <p className="text-lg font-black leading-none mt-0.5">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
