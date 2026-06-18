'use client';

import NextLink from 'next/link';
import { BookOpen, Building2, ExternalLink } from 'lucide-react';
import type { PartnerAdmin } from '@/lib/api/partners';
import { API_ORIGIN } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { safeHostname } from '../partners-page-utils';

type PartnerDetailDialogProps = {
  open: boolean;
  partner: PartnerAdmin | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCourse: (courseId: string) => void;
  onOpenBook: (bookId: string) => void;
};

export function PartnerDetailDialog({
  open,
  partner,
  loading,
  onOpenChange,
  onOpenCourse,
  onOpenBook,
}: PartnerDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-8">Partner details</DialogTitle>
        </DialogHeader>
        {partner ? (
          <div className="space-y-6 py-1">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
                {partner.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_ORIGIN}${partner.logo}`}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-900">{partner.name}</p>
                <Badge variant="outline" className="mt-1 rounded-lg text-[9px] font-black uppercase">
                  {partner.type || 'Partner'}
                </Badge>
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {safeHostname(partner.websiteUrl)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Sort {partner.sortOrder} · Homepage {partner.isActive ? 'live' : 'hidden'}
                  {partner.revenueSharePercent != null
                    ? ` · Rev share ${Number(partner.revenueSharePercent)}%`
                    : ''}
                </p>
              </div>
            </div>
            {partner.description ? (
              <p className="text-sm leading-relaxed text-slate-600">{partner.description}</p>
            ) : null}

            {loading ? (
              <p className="text-center text-sm text-slate-500 py-4">Refreshing links…</p>
            ) : null}

            <div className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked courses</p>
              {(partner.partnerCourses?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">None</p>
              ) : (
                <ul className="space-y-2">
                  {partner.partnerCourses!.map((row) => (
                    <li key={row.course.id}>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto w-full justify-between rounded-xl border-slate-200 py-3 text-left font-bold text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50"
                        onClick={() => onOpenCourse(row.course.id)}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <BookOpen className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="truncate">{row.course.name}</span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked books</p>
              {(partner.partnerBooks?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">None</p>
              ) : (
                <ul className="space-y-2">
                  {partner.partnerBooks!.map((row) => (
                    <li key={row.book.id}>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto w-full justify-between rounded-xl border-slate-200 py-3 text-left font-bold text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50"
                        onClick={() => onOpenBook(row.book.id)}
                      >
                        <span className="flex min-w-0 flex-col items-start gap-0.5">
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 shrink-0 text-amber-600" />
                            <span className="truncate">{row.book.name}</span>
                          </span>
                          <span className="pl-6 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            SKU {row.book.sku}
                          </span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-bold">
                <NextLink href="/admin/courses" target="_blank" rel="noopener noreferrer">
                  Courses admin
                </NextLink>
              </Button>
              <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-bold">
                <NextLink href="/admin/books" target="_blank" rel="noopener noreferrer">
                  Books admin
                </NextLink>
              </Button>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
