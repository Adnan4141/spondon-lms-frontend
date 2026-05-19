import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, MessageCircle } from 'lucide-react';
import type { DoubtThread } from '@/lib/api/doubts';
import { cn } from '@/lib/utils';
import { formatTimeAgo, initials } from './community-utils';

export function DoubtCard({
  thread,
  expanded,
  onToggle,
  actions,
  children,
}: {
  thread: DoubtThread;
  expanded?: boolean;
  onToggle?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const resolved = thread.status === 'RESOLVED' || thread.status === 'CLOSED';
  const replyCount = thread._count?.replies ?? 0;

  return (
    <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white', resolved ? 'bg-emerald-500' : 'bg-amber-500')}>
            {thread.student?.fullName ? initials(thread.student.fullName) : <HelpCircle className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-black uppercase', resolved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                {resolved ? 'Resolved' : 'Open'}
              </span>
              <span className="text-xs font-medium text-slate-400">{formatTimeAgo(thread.createdAt)}</span>
              {thread.course?.name ? (
                <span className="text-xs font-bold text-sky-600">{thread.course.name}</span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Unassigned</span>
              )}
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-950">{thread.title}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{thread.body}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Asked by {thread.student?.fullName || 'Student'}</p>
          </div>
        </div>
        {actions}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <button type="button" onClick={onToggle} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-600">
          <MessageCircle className="h-4 w-4" />
          {replyCount} replies
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="doubt-card-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-slate-100 pt-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
