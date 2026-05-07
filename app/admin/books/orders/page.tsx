'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getOnlineOrders,
  updateDeliveryStatus,
  type OnlineOrder,
  type DeliveryStatus,
} from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import {
  Loader2,
  RefreshCw,
  Search,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  User,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BooksRouteHeader } from '../_components/BooksRouteHeader';

type StatusTab = 'ALL' | DeliveryStatus;

const DELIVERY_STATUSES: { id: DeliveryStatus; label: string; color: string; icon: typeof Clock }[] = [
  { id: 'PENDING', label: 'Pending', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  { id: 'PROCESSING', label: 'Processing', color: 'text-sky-700 bg-sky-50 border-sky-200', icon: Package },
  { id: 'SHIPPED', label: 'Shipped', color: 'text-violet-700 bg-violet-50 border-violet-200', icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  { id: 'CANCELLED', label: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: XCircle },
];

function statusMeta(s: string) {
  return DELIVERY_STATUSES.find(d => d.id === s) ?? DELIVERY_STATUSES[0];
}

export default function OnlineOrdersPage() {
  const { toast, toasts, removeToast } = useToast();
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusTab>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOnlineOrders({ limit: 200 });
      if (res.success && res.data) setOrders(res.data);
    } catch (e: unknown) {
      toast({ title: 'Load failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { PENDING: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach(o => {
      const s = o.delivery?.deliveryStatus ?? 'PENDING';
      if (s in c) c[s]++;
    });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'ALL') {
      list = list.filter(o => (o.delivery?.deliveryStatus ?? 'PENDING') === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.student?.fullName ?? '').toLowerCase().includes(q) ||
        (o.student?.mobile ?? '').includes(q) ||
        (o.delivery?.recipientName ?? '').toLowerCase().includes(q) ||
        (o.delivery?.phone ?? '').includes(q) ||
        (o.items ?? []).some(i => (i.book?.name ?? '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + Number(o.totalAmount), 0), [orders]);

  const handleStatusChange = async (order: OnlineOrder, newStatus: DeliveryStatus) => {
    setBusyId(order.id);
    try {
      const res = await updateDeliveryStatus(order.id, { deliveryStatus: newStatus });
      if (res.success) {
        toast({ title: `Status → ${newStatus}`, variant: 'success' });
        await load();
      } else {
        toast({ title: (res as { message?: string }).message || 'Failed', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: StatusTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: orders.length },
    { id: 'PENDING', label: 'Pending', count: counts.PENDING },
    { id: 'PROCESSING', label: 'Processing', count: counts.PROCESSING },
    { id: 'SHIPPED', label: 'Shipped', count: counts.SHIPPED },
    { id: 'DELIVERED', label: 'Delivered', count: counts.DELIVERED },
    { id: 'CANCELLED', label: 'Cancelled', count: counts.CANCELLED },
  ];

  return (
    <div className="mx-auto max-w-full space-y-8 pb-16 pt-4">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <BooksRouteHeader
        title="Online Orders"
        subtitle="Manage online book orders, update delivery status, and track shipments."
      >
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-xl border-slate-200 font-bold text-xs"
          onClick={() => load()}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </BooksRouteHeader>

      {/* Stats cards */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Total Orders</span>
            </div>
            <p className="mt-1 text-2xl font-black text-indigo-900 tabular-nums">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Pending</span>
            </div>
            <p className="mt-1 text-2xl font-black text-amber-900 tabular-nums">{counts.PENDING}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-violet-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-700">Shipped</span>
            </div>
            <p className="mt-1 text-2xl font-black text-violet-900 tabular-nums">{counts.SHIPPED}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Revenue</span>
            </div>
            <p className="mt-1 text-2xl font-black text-emerald-900 tabular-nums">৳{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 w-fit overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
                statusFilter === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className="min-w-5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-black tabular-nums">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            className="h-9 w-full sm:w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Search student, phone, book..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-bold text-slate-600">
            {orders.length === 0 ? 'No online orders yet' : 'No orders match your filters'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {orders.length === 0 ? 'When students purchase books online, orders will appear here.' : 'Try adjusting the status filter or search.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(order => {
            const busy = busyId === order.id;
            const isOpen = expandedId === order.id;
            const del = order.delivery;
            const currentStatus = del?.deliveryStatus ?? 'PENDING';
            const meta = statusMeta(currentStatus);
            const StatusIcon = meta.icon;
            const invoiceStatus = order.invoice?.status ?? '—';
            const isPaid = invoiceStatus === 'PAID' || Number(order.invoice?.dueAmount ?? 1) <= 0;

            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px] font-black uppercase tracking-wide', meta.color)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {meta.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-black uppercase tracking-wide',
                          isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {isPaid ? 'Paid' : invoiceStatus}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <h2 className="text-base font-bold text-slate-900">
                        {order.student?.fullName ?? 'Walk-in'}
                      </h2>
                      {order.student?.mobile && (
                        <span className="text-xs text-slate-500">{order.student.mobile}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <span>
                        {(order.items ?? []).length} item{(order.items ?? []).length !== 1 ? 's' : ''}
                      </span>
                      <span className="font-bold text-slate-700">
                        ৳{Number(order.totalAmount).toLocaleString()}
                      </span>
                      <span>{new Date(order.soldAt).toLocaleDateString('en-GB')}</span>
                    </div>

                    {/* Book names */}
                    <div className="flex flex-wrap gap-1.5">
                      {(order.items ?? []).map(item => (
                        <span
                          key={item.id}
                          className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                        >
                          {item.book?.name ?? item.bookId} ×{item.qty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-col sm:items-stretch">
                    {currentStatus === 'PENDING' && (
                      <Button
                        type="button" size="sm"
                        className="rounded-xl bg-sky-600 font-bold hover:bg-sky-700 text-xs"
                        disabled={busy}
                        onClick={() => handleStatusChange(order, 'PROCESSING')}
                      >
                        <Package className="mr-1.5 h-3.5 w-3.5" /> Process
                      </Button>
                    )}
                    {currentStatus === 'PROCESSING' && (
                      <Button
                        type="button" size="sm"
                        className="rounded-xl bg-violet-600 font-bold hover:bg-violet-700 text-xs"
                        disabled={busy}
                        onClick={() => handleStatusChange(order, 'SHIPPED')}
                      >
                        <Truck className="mr-1.5 h-3.5 w-3.5" /> Ship
                      </Button>
                    )}
                    {currentStatus === 'SHIPPED' && (
                      <Button
                        type="button" size="sm"
                        className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700 text-xs"
                        disabled={busy}
                        onClick={() => handleStatusChange(order, 'DELIVERED')}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Delivered
                      </Button>
                    )}
                    {(currentStatus === 'PENDING' || currentStatus === 'PROCESSING') && (
                      <Button
                        type="button" size="sm" variant="outline"
                        className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
                        disabled={busy}
                        onClick={() => handleStatusChange(order, 'CANCELLED')}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel
                      </Button>
                    )}
                    {currentStatus === 'DELIVERED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Delivered
                      </span>
                    )}
                    {currentStatus === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="h-4 w-4" /> Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable delivery details */}
                <div className="border-t border-slate-100">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                  >
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isOpen ? 'Hide' : 'Show'} delivery details
                  </button>
                  {isOpen && del && (
                    <div className="px-5 pb-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient</p>
                            <p className="text-sm font-bold text-slate-800">{del.recipientName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                            <p className="text-sm font-bold text-slate-800">{del.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</p>
                            <p className="text-sm font-bold text-slate-800">
                              {del.address}
                              {del.city ? `, ${del.city}` : ''}
                              {del.postalCode ? ` - ${del.postalCode}` : ''}
                            </p>
                          </div>
                        </div>
                        {del.trackingNumber && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <Truck className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking</p>
                              <p className="text-sm font-bold text-indigo-700">{del.trackingNumber}</p>
                            </div>
                          </div>
                        )}
                        {del.notes && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</p>
                              <p className="text-sm text-slate-600">{del.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items table */}
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-left font-bold uppercase text-slate-500">
                            <tr>
                              <th className="px-3 py-2">Book</th>
                              <th className="px-3 py-2 text-center">Qty</th>
                              <th className="px-3 py-2 text-right">Price</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(order.items ?? []).map(item => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 font-medium">{item.book?.name ?? item.bookId}</td>
                                <td className="px-3 py-2 text-center tabular-nums">{item.qty}</td>
                                <td className="px-3 py-2 text-right tabular-nums">৳{Number(item.unitPrice).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right font-bold tabular-nums">৳{Number(item.lineTotal).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold">
                            <tr>
                              <td className="px-3 py-2" colSpan={3}>Total</td>
                              <td className="px-3 py-2 text-right tabular-nums">৳{Number(order.totalAmount).toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
