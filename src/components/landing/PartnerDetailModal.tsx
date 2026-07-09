'use client';

import type { ElementType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  ChevronRight,
  ExternalLink,
  Globe2,
  GraduationCap,
  Handshake,
  Library,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { PublicPartnerDetail } from '@/lib/api/partners';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type PartnerDetailModalProps = {
  open: boolean;
  detail: PublicPartnerDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
};

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function StatPill({
  icon: Icon,
  label,
  count,
  tone,
}: {
  icon: ElementType;
  label: string;
  count: number;
  tone: 'indigo' | 'emerald' | 'amber';
}) {
  const tones = {
    indigo: 'border-indigo-100 bg-indigo-50/80 text-indigo-700',
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-800',
  };

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center',
        tones[tone],
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span className="text-lg font-black tabular-nums leading-none">{count}</span>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
    </div>
  );
}

function LinkRow({
  href,
  title,
  subtitle,
  icon: Icon,
  tone,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon: ElementType;
  tone: 'indigo' | 'emerald' | 'amber';
}) {
  const iconTone = {
    indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
          iconTone[tone],
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-700">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
    </Link>
  );
}

function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-5 px-6 pb-6 pt-2">
      <div className="mx-auto h-20 w-36 rounded-2xl bg-slate-200/70" />
      <div className="mx-auto h-4 w-28 rounded-full bg-slate-200/70" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-14 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export function PartnerDetailModal({
  open,
  detail,
  loading,
  error,
  onClose,
  onRetry,
}: PartnerDetailModalProps) {
  const programCount = detail?.partnerPrograms?.length ?? 0;
  const courseCount = detail?.partnerCourses?.length ?? 0;
  const bookCount = detail?.partnerBooks?.length ?? 0;
  const hasLinks = programCount + courseCount + bookCount > 0;
  const logoSrc =
    detail?.logo != null
      ? resolveAttachmentUrl(detail.logo, API_ORIGIN) || 'https://placehold.co/240x128?text=Logo'
      : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className="max-h-[min(92vh,720px)] gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-xl"
      >
        <DialogTitle className="sr-only">{detail?.name ?? 'Partner details'}</DialogTitle>
        <DialogDescription className="sr-only">
          Partner profile with linked programs, courses, and books.
        </DialogDescription>

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-6 pb-8 pt-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 backdrop-blur-sm">
              <Handshake className="h-3 w-3" aria-hidden />
              Trusted partner
            </div>

            <div className="relative mb-4 flex h-24 w-40 items-center justify-center rounded-[22px] border border-white/20 bg-white p-4 shadow-xl shadow-indigo-900/25">
              {logoSrc ? (
                <Image src={logoSrc} alt="" fill className="object-contain p-2" sizes="160px" />
              ) : (
                <Building2 className="h-10 w-10 text-indigo-300" aria-hidden />
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              {loading && !detail ? 'Loading partner…' : detail?.name ?? 'Partner'}
            </h2>

            {detail?.type ? (
              <Badge className="mt-2 rounded-full border-0 bg-white/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20">
                {detail.type}
              </Badge>
            ) : null}

            {detail?.websiteUrl ? (
              <a
                href={detail.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/20 transition-transform hover:scale-[1.02] hover:bg-indigo-50"
              >
                <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
                {safeHostname(detail.websiteUrl)}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain px-6 py-5">
          {loading ? (
            <ModalSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <Sparkles className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Could not load partner</p>
                <p className="mt-1 text-sm text-slate-500">{error}</p>
              </div>
              {onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl font-bold"
                  onClick={onRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                  Try again
                </Button>
              ) : null}
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {detail.description ? (
                <p className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
                  {detail.description}
                </p>
              ) : null}

              {hasLinks ? (
                <div className="grid grid-cols-3 gap-2">
                  <StatPill icon={GraduationCap} label="Programs" count={programCount} tone="indigo" />
                  <StatPill icon={BookOpen} label="Courses" count={courseCount} tone="emerald" />
                  <StatPill icon={Library} label="Books" count={bookCount} tone="amber" />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-600">No linked offerings yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Programs, courses, and books will appear here when connected.
                  </p>
                </div>
              )}

              {programCount > 0 ? (
                <section className="space-y-2.5">
                  <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
                    Programs
                  </h3>
                  <ul className="space-y-2">
                    {detail.partnerPrograms!.map((row) => (
                      <li key={row.program.id}>
                        <LinkRow
                          href="/courses"
                          title={row.program.name}
                          icon={GraduationCap}
                          tone="indigo"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {courseCount > 0 ? (
                <section className="space-y-2.5">
                  <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                    Courses
                  </h3>
                  <ul className="space-y-2">
                    {detail.partnerCourses!.map((row) => (
                      <li key={row.course.id}>
                        <LinkRow
                          href="/courses"
                          title={row.course.name}
                          icon={BookOpen}
                          tone="emerald"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {bookCount > 0 ? (
                <section className="space-y-2.5">
                  <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Library className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                    Books
                  </h3>
                  <ul className="space-y-2">
                    {detail.partnerBooks!.map((row) => (
                      <li key={row.book.id}>
                        <LinkRow
                          href={`/books/${row.book.id}`}
                          title={row.book.name}
                          subtitle={`SKU ${row.book.sku}`}
                          icon={Library}
                          tone="amber"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-bold">
                  <Link href="/courses">
                    Browse courses
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-bold">
                  <Link href="/books">
                    Browse books
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
