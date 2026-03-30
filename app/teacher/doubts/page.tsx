'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getDoubtThreads, DoubtThread } from '@/lib/api/doubts';
import { HelpCircle, MessageCircle, Clock, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function TeacherDoubtsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<DoubtThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'RESOLVED' | 'all'>('OPEN');

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u?.id ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const loadDoubts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params: any = { teacherUserId: userId };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await getDoubtThreads(params);
      if (res.success && res.data) setDoubts(res.data);
      else setDoubts([]);
    } catch (err) {
      console.error('Failed to load doubts', err);
      setDoubts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter]);

  useEffect(() => {
    loadDoubts();
  }, [loadDoubts]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Student Doubts</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl">
            Questions from students in your assigned courses. Help them clear their concepts.
          </p>
        </div>
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          {(['OPEN', 'RESOLVED', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                statusFilter === s
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-[2rem] bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : doubts.length === 0 ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
            {statusFilter === 'OPEN' ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            ) : (
              <HelpCircle className="h-12 w-12 text-slate-300" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {statusFilter === 'OPEN' ? 'All caught up!' : 'No resolved doubts found.'}
          </h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            {statusFilter === 'OPEN' 
              ? "You've answered all student questions in this category. Great job!"
              : "You haven't marked any questions as resolved yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doubts.map((doubt) => (
            <Link
              key={doubt.id}
              href={`/teacher/doubts/${doubt.id}`}
              className="group relative flex flex-col rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className={cn(
                  "rounded-lg text-[10px] font-black uppercase tracking-wider border",
                  doubt.status === 'OPEN' ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                )}>
                  {doubt.status}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(doubt.createdAt), 'MMM d, yyyy')}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {(doubt as any).course?.code || 'Course'}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-4">
                {doubt.title}
              </h3>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                    {(doubt as any).student?.fullName?.charAt(0) || 'S'}
                  </div>
                  <span className="text-xs font-bold text-slate-500">{(doubt as any).student?.fullName || 'Student'}</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                  Reply
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <MessageCircle className="h-32 w-32" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
