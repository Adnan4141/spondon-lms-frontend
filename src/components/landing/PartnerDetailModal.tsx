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
  X,
} from 'lucide-react';
import type { PublicPartnerDetail } from '@/lib/api/partners';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
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

type Tone = 'indigo' | 'emerald' | 'amber';

const TONE_STYLES: Record<
  Tone,
  { pill: string; icon: string; row: string; heading: string; linkHover: string }
> = {
  indigo: {
    pill: 'border-indigo-200/80 bg-indigo-50 text-indigo-800',
    icon: 'bg-indigo-600 text-white shadow-indigo-200',
    row: 'hover:border-indigo-200 hover:bg-indigo-50/40',
    heading: 'text-indigo-600',
    linkHover: 'group-hover:text-indigo-700',
  },
  emerald: {
    pill: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
    icon: 'bg-emerald-600 text-white shadow-emerald-200',
    row: 'hover:border-emerald-200 hover:bg-emerald-50/40',
    heading: 'text-emerald-600',
    linkHover: 'group-hover:text-emerald-800',
  },
  amber: {
    pill: 'border-amber-200/80 bg-amber-50 text-amber-900',
    icon: 'bg-amber-600 text-white shadow-amber-200',
    row: 'hover:border-amber-200 hover:bg-amber-50/40',
    heading: 'text-amber-700',
    linkHover: 'group-hover:text-amber-900',
  },
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
  tone: Tone;
}) {
  return (
    <div
      className={cn(
        'flex min-w-[5.5rem] flex-1 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3.5 text-center shadow-sm',
        TONE_STYLES[tone].pill,
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl shadow-md',
          TONE_STYLES[tone].icon,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <span className="text-2xl font-black tabular-nums leading-none tracking-tight">{count}</span>
      <span className="text-[9px] font-black uppercase tracking-[0.18em] opacity-75">{label}</span>
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
  tone: Tone;
}) {
  const s = TONE_STYLES[tone];

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md',
        s.row,
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105',
          s.icon,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-bold text-slate-800 transition-colors', s.linkHover)}>
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}

function SectionHeading({ icon: Icon, label, tone }: { icon: ElementType; label: string; tone: Tone }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
      <div
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg',
          TONE_STYLES[tone].icon,
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <h3 className={cn('text-[11px] font-black uppercase tracking-[0.2em]', TONE_STYLES[tone].heading)}>
        {label}
      </h3>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-5 px-6 pb-6 pt-4">
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="flex gap-2">
        <div className="h-20 flex-1 rounded-2xl bg-slate-100" />
        <div className="h-20 flex-1 rounded-2xl bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-14 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-md"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
    </Link>
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

  const activeStats = [
    programCount > 0 ? { icon: GraduationCap, label: 'Programs', count: programCount, tone: 'indigo' as const } : null,
    courseCount > 0 ? { icon: BookOpen, label: 'Courses', count: courseCount, tone: 'emerald' as const } : null,
    bookCount > 0 ? { icon: Library, label: 'Books', count: bookCount, tone: 'amber' as const } : null,
  ].filter(Boolean);

  const logoSrc =
    detail?.logo != null
      ? resolveAttachmentUrl(detail.logo, API_ORIGIN) || 'https://placehold.co/240x128?text=Logo'
      : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(92vh,720px)] gap-0 overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50 p-0 shadow-2xl shadow-slate-900/15 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">{detail?.name ?? 'Partner details'}</DialogTitle>
        <DialogDescription className="sr-only">
          Partner profile with linked programs, courses, and books.
        </DialogDescription>

        {/* Hero */}
        <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-indigo-800 px-6 pb-10 pt-5 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.35),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.12),transparent_50%)]" />

          <DialogClose
            className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogClose>

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-100 backdrop-blur-sm">
              <Handshake className="h-3.5 w-3.5 text-sky-300" aria-hidden />
              Trusted partner
            </div>

            <div className="relative mb-5 h-[5.5rem] w-44 overflow-hidden rounded-[24px] border border-white/25 bg-white p-3 shadow-2xl shadow-black/25 ring-4 ring-white/10">
              {logoSrc ? (
                <Image src={logoSrc} alt="" fill className="object-contain p-1" sizes="176px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Building2 className="h-10 w-10 text-indigo-300" aria-hidden />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
              {loading && !detail ? 'Loading partner…' : detail?.name ?? 'Partner'}
            </h2>

            {detail?.type ? (
              <Badge className="mt-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-100 hover:bg-white/15">
                {detail.type}
              </Badge>
            ) : null}

            {detail?.websiteUrl ? (
              <a
                href={detail.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/95 px-5 py-2.5 text-sm font-bold text-indigo-900 shadow-lg shadow-black/20 transition-all hover:scale-[1.02] hover:bg-white"
              >
                <Globe2 className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                {safeHostname(detail.websiteUrl)}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-indigo-400" aria-hidden />
              </a>
            ) : null}
          </div>

          {/* Soft curve into body */}
          <div className="pointer-events-none absolute -bottom-px left-0 right-0 h-6 bg-slate-50 rounded-t-[28px]" />
        </div>

        {/* Body */}
        <div className="max-h-[min(50vh,400px)] overflow-y-auto overscroll-contain bg-slate-50 px-5 pb-5 pt-1 sm:px-6">
          {loading ? (
            <ModalSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-4 ring-rose-50">
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
                  className="rounded-xl border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
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
                <p className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm leading-relaxed text-slate-600 shadow-sm">
                  {detail.description}
                </p>
              ) : null}

              {activeStats.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-2.5',
                    activeStats.length === 1 && 'grid-cols-1',
                    activeStats.length === 2 && 'grid-cols-2',
                    activeStats.length >= 3 && 'grid-cols-3',
                  )}
                >
                  {activeStats.map((stat) =>
                    stat ? (
                      <StatPill
                        key={stat.label}
                        icon={stat.icon}
                        label={stat.label}
                        count={stat.count}
                        tone={stat.tone}
                      />
                    ) : null,
                  )}
                </div>
              ) : !hasLinks ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Handshake className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No linked offerings yet</p>
                  <p className="mx-auto mt-1.5 max-w-[240px] text-xs leading-relaxed text-slate-500">
                    Programs, courses, and books from this partner will show up here.
                  </p>
                </div>
              ) : null}

              {programCount > 0 ? (
                <section className="space-y-3">
                  <SectionHeading icon={GraduationCap} label="Programs" tone="indigo" />
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
                <section className="space-y-3">
                  <SectionHeading icon={BookOpen} label="Courses" tone="emerald" />
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
                <section className="space-y-3">
                  <SectionHeading icon={Library} label="Books" tone="amber" />
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

              <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-4">
                <FooterLink href="/courses" label="Browse courses" />
                <FooterLink href="/books" label="Browse books" />
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
