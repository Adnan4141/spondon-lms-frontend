'use client';

import { useEffect, useRef, useState } from 'react';
import { getProgramById, deleteProgramCascade } from '@/lib/api/programs';
import { API_ORIGIN } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  BookOpen,
  ImageOff,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgramWithCourses {
  id: string;
  name: string;
  courses: Course[];
}

interface Props {
  programId: string;
  onClose: () => void;
  onDeleted: (courseCount: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveThumbnail(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
}

function statusColor(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-600';
  if (status === 'INACTIVE') return 'bg-slate-100 text-slate-500';
  return 'bg-amber-50 text-amber-600';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgramCascadeDeleteModal({ programId, onClose, onDeleted }: Props) {
  const [program, setProgram] = useState<ProgramWithCourses | null>(null);
  const [fetching, setFetching] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch program + linked courses on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await getProgramById(programId);
        if (res.success && res.data) {
          setProgram(res.data as ProgramWithCourses);
        }
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [programId]);

  // Focus input once loaded
  useEffect(() => {
    if (!fetching && program) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [fetching, program]);

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const nameMatches = program ? confirmText.trim() === program.name.trim() : false;

  async function handleDelete() {
    if (!program || !nameMatches || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteProgramCascade(programId);
      if (res.success) {
        onDeleted(res.data?.courseCount ?? program.courses.length);
      }
    } catch {
      setDeleting(false);
    }
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (fetching) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm font-bold text-slate-400">Loading program data…</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl flex flex-col items-center gap-4">
          <p className="text-sm font-bold text-rose-500">Failed to load program data.</p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const courseCount = program.courses.length;

  // ── Modal ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-rose-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cascade-delete-title"
      >
        {/* Header */}
        <div className="relative bg-linear-to-r from-rose-50 to-red-50 border-b border-rose-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h2 id="cascade-delete-title" className="text-base font-black text-rose-700 leading-tight">
                Delete Program and All Linked Courses
              </h2>
              <p className="mt-1 text-xs font-bold text-rose-400">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="absolute right-4 top-4 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Warning */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-sm font-bold text-rose-600">
            This will permanently delete the program{' '}
            <span className="font-black underline underline-offset-2">&ldquo;{program.name}&rdquo;</span>{' '}
            and{' '}
            <span className="font-black">all {courseCount} linked course{courseCount !== 1 ? 's' : ''}</span>.
            Students, batches, and enrollments tied to those courses will also be affected.
          </div>

          {/* Linked course list */}
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <BookOpen className="h-3.5 w-3.5" />
              {courseCount > 0
                ? `This program contains ${courseCount} course${courseCount !== 1 ? 's' : ''}`
                : 'No linked courses'}
            </p>

            {courseCount > 0 && (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                {program.courses.map((course) => {
                  const thumb = resolveThumbnail(course.thumbnail);
                  return (
                    <div key={course.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={course.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{course.name}</p>
                        {course.code && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{course.code}</p>
                        )}
                      </div>
                      <Badge className={cn('text-[9px] font-black uppercase tracking-widest border-0 rounded-md px-2 py-0.5 shrink-0', statusColor(course.status))}>
                        {course.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Typed confirmation */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-600">
              Type{' '}
              <span className="font-mono bg-slate-100 rounded px-1.5 py-0.5 text-rose-600 select-all">
                {program.name}
              </span>{' '}
              to confirm deletion:
            </label>
            <Input
              ref={inputRef}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type exact program name…`}
              disabled={deleting}
              className={cn(
                'font-bold transition-colors',
                confirmText.length > 0 && !nameMatches
                  ? 'border-rose-300 focus-visible:ring-rose-200'
                  : nameMatches
                  ? 'border-emerald-300 focus-visible:ring-emerald-200'
                  : ''
              )}
              onKeyDown={(e) => { if (e.key === 'Enter' && nameMatches) handleDelete(); }}
            />
            {confirmText.length > 0 && !nameMatches && (
              <p className="text-[10px] font-bold text-rose-400">
                Name does not match — type it exactly as shown.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="font-bold"
          >
            Cancel
          </Button>
          <Button
            disabled={!nameMatches || deleting}
            onClick={handleDelete}
            className={cn(
              'font-black gap-2 transition-all',
              nameMatches
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting program &amp; {courseCount} course{courseCount !== 1 ? 's' : ''}…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Program &amp; Courses
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
