'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, CreditCard, Eye, MoreVertical, Pencil, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student } from '../types';

export function RowActions({
  student, onAction,
}: {
  student: Student;
  onAction: (action: string, student: Student) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onScroll = () => { if (open) setOpen(false); };
    document.addEventListener('mousedown', h);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', h);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const MENU_ESTIMATED_HEIGHT = 260; // px — approx height of 6 items

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = window.innerWidth - rect.right;
      if (spaceBelow < MENU_ESTIMATED_HEIGHT && rect.top > MENU_ESTIMATED_HEIGHT) {
        // Flip upward
        setMenuPos({ bottom: window.innerHeight - rect.top + 4, right });
      } else {
        // Default: open downward
        setMenuPos({ top: rect.bottom + 4, right });
      }
    }
    setOpen(o => !o);
  };

  const hasEnrollments = (student._count?.enrollments ?? 0) > 0;

  const actions: {
    id: string;
    icon: React.FC<{ className?: string }>;
    label: string;
    danger?: boolean;
    disabled?: boolean;
    title?: string;
  }[] = [
    { id: 'view', icon: Eye, label: 'View Profile' },
    { id: 'edit', icon: Pencil, label: 'Edit Student' },
    { id: 'enrollments', icon: BookOpen, label: 'View Enrollments' },
    { id: 'enroll', icon: Tag, label: 'New Enrollment' },
    {
      id: 'payment',
      icon: CreditCard,
      label: 'Collect Payment',
      disabled: !hasEnrollments,
      title: !hasEnrollments ? 'Add an enrollment first' : undefined,
    },
  ];

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={cn(
          'p-1.5 rounded-md border transition-colors cursor-pointer',
          open
            ? 'bg-slate-100 border-slate-300 text-slate-700'
            : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 hover:border-slate-200',
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', ...menuPos }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl min-w-48 z-9999 overflow-hidden"
        >
          {actions.map((a, i) => (
            <button
              key={a.id}
              type="button"
              title={a.title}
              disabled={a.disabled}
              onClick={() => {
                if (a.disabled) return;
                onAction(a.id, student);
                setOpen(false);
              }}
              className={cn(
                'w-full px-3.5 py-2.5 text-left text-sm font-semibold flex items-center gap-2.5 transition-colors',
                i === 4 && 'border-t border-slate-100',
                a.disabled
                  ? 'text-slate-400 cursor-not-allowed opacity-60'
                  : a.danger
                    ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                    : 'text-slate-800 hover:bg-slate-50 cursor-pointer',
              )}
            >
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
