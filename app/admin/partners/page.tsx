'use client';

import { useEffect, useState, useCallback } from 'react';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { PartnerAdminForm } from '@/components/admin/partners/PartnerAdminForm';
import {
  deletePartner,
  getAllPartners,
  getPartnerById,
  patchPartner,
  getPartnerRevenueSummary,
  type PartnerAdmin,
  type PartnerRevenueSummary,
} from '@/lib/api/partners';
import { getCourseById } from '@/lib/api/courses';
import { getBookById } from '@/lib/api/books';
import type { CourseDetails } from '@/types/course';
import { CourseDetailsView } from '@/components/admin/courses/CourseDetailsView';
import { API_ORIGIN } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Globe2,
  ShieldCheck,
  Building2,
  Activity,
  Link2,
  ExternalLink,
  Search,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.length > 48 ? `${url.slice(0, 48)}…` : url;
  }
}

export default function AdminPartnersPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [partners, setPartners] = useState<PartnerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [revenuePartner, setRevenuePartner] = useState<PartnerAdmin | null>(null);
  const [revenueSummary, setRevenueSummary] = useState<PartnerRevenueSummary | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [showRevenueDialog, setShowRevenueDialog] = useState(false);

  const [detailPartner, setDetailPartner] = useState<PartnerAdmin | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPartners();
      if (res.success) setPartners(res.data || []);
    } catch (err) {
      toast({ title: 'Failed to load partners', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (existing?: PartnerAdmin) => {
    openModal({
      title: existing ? 'Edit partner' : 'Add partner',
      description:
        'Partners appear on the homepage carousel when active. Set sort order and upload a clear logo (PNG/SVG recommended).',
      className: 'sm:max-w-4xl max-h-[90vh] overflow-y-auto',
      content: (
        <PartnerAdminForm
          existing={existing}
          onCancel={() => closeModal()}
          onSaved={async () => {
            await load();
            closeModal();
            toast({ title: existing ? 'Partner updated' : 'Partner created', variant: 'success' });
          }}
        />
      ),
    });
  };

  const remove = (id: string) => {
    openModal({
      title: 'Remove partner',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Delete this partner?"
          description="Removes the logo and details from the admin list and the public homepage carousel."
          variant="danger"
          onConfirm={async () => {
            await deletePartner(id);
            await load();
            toast({ title: 'Partner deleted', variant: 'success' });
          }}
        />
      ),
    });
  };

  const openPartnerDetails = async (p: PartnerAdmin) => {
    setDetailPartner(p);
    setShowDetailDialog(true);
    setDetailLoading(true);
    try {
      const res = await getPartnerById(p.id);
      if (res.success && res.data) setDetailPartner(res.data);
    } catch (err) {
      toast({
        title: 'Could not load partner',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openLinkedCourse = async (courseId: string) => {
    try {
      const res = await getCourseById(courseId);
      if (res.success && res.data) {
        openModal({
          title: res.data.name,
          description: 'Course details',
          className: 'sm:max-w-6xl max-h-[92vh] overflow-y-auto',
          content: (
            <CourseDetailsView
              course={res.data as CourseDetails}
              onAfterMutation={async () => {
                closeModal();
                await load();
              }}
            />
          ),
        });
      } else {
        toast({ title: 'Course not found', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Failed to open course', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const openLinkedBook = async (bookId: string) => {
    try {
      const res = await getBookById(bookId);
      if (res.success && res.data) {
        const b = res.data;
        openModal({
          title: b.name,
          description: `SKU ${b.sku}`,
          className: 'sm:max-w-md',
          content: (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <p className="text-xs text-slate-500">Price</p>
                <p className="text-lg font-bold text-slate-900">৳{Number(b.price ?? 0).toLocaleString()}</p>
                {b.author ? (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-500">Author:</span> {b.author}
                  </p>
                ) : null}
              </div>
              <Button asChild className="w-full rounded-xl" variant="outline">
                <NextLink href="/admin/books" target="_blank" rel="noopener noreferrer">
                  Open Books admin
                  <ExternalLink className="ml-2 h-4 w-4" />
                </NextLink>
              </Button>
            </div>
          ),
        });
      } else {
        toast({ title: 'Book not found', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Failed to open book', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const toggleActive = async (p: PartnerAdmin, next: boolean) => {
    try {
      setTogglingId(p.id);
      await patchPartner(p.id, { isActive: next });
      setPartners((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: next } : x)));
      toast({ title: next ? 'Visible on site' : 'Hidden from site', variant: 'success' });
    } catch (e) {
      toast({ title: 'Update failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.type || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hiddenCount = partners.filter((p) => !p.isActive).length;

  return (
    <div className="space-y-10 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
            <Building2 className="h-3 w-3" />
            Homepage · Partners
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Partners</h1>
          <p className="mt-1 font-medium text-slate-500">
            Manage logos and links for the <strong>Trusted by</strong> section on the public home page.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 shadow-sm transition-all hover:bg-slate-50"
            onClick={load}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          <Button
            className="h-12 rounded-2xl bg-indigo-600 px-6 font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700"
            onClick={() => openForm()}
          >
            <Plus className="mr-2 h-4 w-4" /> Add partner
          </Button>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { label: 'Total partners', value: partners.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Visible on homepage', value: partners.filter((p) => p.isActive).length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Hidden (draft)', value: hiddenCount, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] shadow-inner',
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 p-6">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name or category…"
              className="h-12 w-full rounded-2xl border-none bg-slate-50 pl-11 text-sm font-bold outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Partner</TableHead>
              <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</TableHead>
              <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Website</TableHead>
              <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Collaborations</TableHead>
              <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">On homepage</TableHead>
              <TableHead className="px-8 py-4 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((p) => (
              <TableRow
                key={p.id}
                role="button"
                tabIndex={0}
                className="group cursor-pointer border-slate-50 transition-colors hover:bg-slate-50/50"
                onClick={() => void openPartnerDetails(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void openPartnerDetails(p);
                  }
                }}
              >
                <TableCell className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition-transform group-hover:scale-105">
                      {p.logo ? (
                        <img
                          src={`${API_ORIGIN}${p.logo}`}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 transition-colors group-hover:text-indigo-600">{p.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Order {p.sortOrder} · {format(new Date(p.createdAt), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant="outline"
                    className="rounded-lg border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-indigo-700 shadow-none"
                  >
                    {p.type || 'Partner'}
                  </Badge>
                </TableCell>
                <TableCell className="py-5" onClick={(e) => e.stopPropagation()}>
                  {p.websiteUrl ? (
                    <a
                      href={p.websiteUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition-all hover:text-indigo-700 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {safeHostname(p.websiteUrl)}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-xs font-bold text-slate-300">—</span>
                  )}
                </TableCell>
                <TableCell className="py-5">
                  <span className="text-xs font-bold text-slate-600">
                    {(p.partnerCourses?.length ?? 0) + (p.partnerBooks?.length ?? 0) > 0
                      ? [
                          p.partnerCourses?.length ? `${p.partnerCourses.length} course` : '',
                          p.partnerBooks?.length ? `${p.partnerBooks.length} book` : '',
                        ].filter(Boolean).join(' · ')
                      : '—'}
                  </span>
                </TableCell>
                <TableCell className="py-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={p.isActive}
                      disabled={togglingId === p.id}
                      onCheckedChange={(checked) => toggleActive(p, checked)}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {p.isActive ? 'Live' : 'Off'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                      onClick={async () => {
                        setRevenuePartner(p);
                        setRevenueSummary(null);
                        setShowRevenueDialog(true);
                        setRevenueLoading(true);
                        try {
                          const res = await getPartnerRevenueSummary(p.id);
                          if (res.success && res.data) setRevenueSummary(res.data);
                        } finally {
                          setRevenueLoading(false);
                        }
                      }}
                    >
                      <BarChart3 className="mr-1 h-3.5 w-3.5" /> Revenue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
                      onClick={() => openForm(p)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredPartners.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-200">
                    <Globe2 className="h-10 w-10" />
                  </div>
                  <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No partners match your search.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Partner details — collaborations */}
      <Dialog
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) setDetailPartner(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8">Partner details</DialogTitle>
          </DialogHeader>
          {detailPartner ? (
            <div className="space-y-6 py-1">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
                  {detailPartner.logo ? (
                    <img
                      src={`${API_ORIGIN}${detailPartner.logo}`}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-slate-900">{detailPartner.name}</p>
                  <Badge variant="outline" className="mt-1 rounded-lg text-[9px] font-black uppercase">
                    {detailPartner.type || 'Partner'}
                  </Badge>
                  {detailPartner.websiteUrl ? (
                    <a
                      href={detailPartner.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {safeHostname(detailPartner.websiteUrl)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Sort {detailPartner.sortOrder} · Homepage {detailPartner.isActive ? 'live' : 'hidden'}
                    {detailPartner.revenueSharePercent != null
                      ? ` · Rev share ${Number(detailPartner.revenueSharePercent)}%`
                      : ''}
                  </p>
                </div>
              </div>
              {detailPartner.description ? (
                <p className="text-sm leading-relaxed text-slate-600">{detailPartner.description}</p>
              ) : null}

              {detailLoading ? (
                <p className="text-center text-sm text-slate-500 py-4">Refreshing links…</p>
              ) : null}

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked courses</p>
                {(detailPartner.partnerCourses?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-400">None</p>
                ) : (
                  <ul className="space-y-2">
                    {detailPartner.partnerCourses!.map((row) => (
                      <li key={row.course.id}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto w-full justify-between rounded-xl border-slate-200 py-3 text-left font-bold text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50"
                          onClick={() => void openLinkedCourse(row.course.id)}
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
                {(detailPartner.partnerBooks?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-400">None</p>
                ) : (
                  <ul className="space-y-2">
                    {detailPartner.partnerBooks!.map((row) => (
                      <li key={row.book.id}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto w-full justify-between rounded-xl border-slate-200 py-3 text-left font-bold text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50"
                          onClick={() => void openLinkedBook(row.book.id)}
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
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Revenue Summary Dialog */}
      <Dialog open={showRevenueDialog} onOpenChange={setShowRevenueDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Revenue Summary — {revenuePartner?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {revenueLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
            ) : revenueSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 border p-3">
                    <p className="text-xs text-slate-500">Gross Course & Book Revenue</p>
                    <p className="text-lg font-bold">৳{Number(revenueSummary.totalSales || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-xs text-slate-500">Partner Share ({revenueSummary.revenueSharePercent ?? 0}%)</p>
                    <p className="text-lg font-bold text-emerald-700">৳{Number(revenueSummary.partnerShare).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <p className="text-xs text-slate-500">{revenueSummary.courseCount} associated course(s)</p>
                  <p className="text-xs text-slate-500">{revenueSummary.bookCount} associated book(s)</p>
                </div>
                <p className="text-xs text-slate-400">
                  Period: {revenueSummary.from ? new Date(revenueSummary.from).toLocaleDateString() : 'All time'} – {revenueSummary.to ? new Date(revenueSummary.to).toLocaleDateString() : 'now'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No revenue data.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevenueDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
