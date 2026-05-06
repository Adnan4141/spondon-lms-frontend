'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getOnlineOrders,
  getOnlineOrderSummary,
  type DeliveryStatus,
  type OnlineOrder,
  type OnlineOrderSummary,
} from '@/lib/api/books';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Banknote, PackageCheck, RefreshCw, Search, ShoppingBag, Truck } from 'lucide-react';
import { StatsCard } from './StatsCard';

type DeliveryFilter = 'ALL' | DeliveryStatus;
type InvoiceFilter = 'ALL' | 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'CANCELLED';

const deliveryStatuses: DeliveryStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const invoiceStatuses: Exclude<InvoiceFilter, 'ALL'>[] = ['DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED'];

function money(value: unknown) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

const emptySummary: OnlineOrderSummary = {
  totals: { orderCount: 0, totalRevenue: 0, paidAmount: 0, dueAmount: 0 },
  statusCounts: {},
  invoiceStatusCounts: {},
  byBook: [],
};

export function OnlineSalesTab() {
  const toast = useAdminToast();
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [summary, setSummary] = useState<OnlineOrderSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryFilter>('ALL');
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceFilter>('ALL');
  const [search, setSearch] = useState('');

  const params = useMemo(() => ({
    deliveryStatus: deliveryStatus === 'ALL' ? undefined : deliveryStatus,
    invoiceStatus: invoiceStatus === 'ALL' ? undefined : invoiceStatus,
    search: search.trim() || undefined,
    from: fromDate ? fromDate.toISOString() : undefined,
    to: toDate ? toDate.toISOString() : undefined,
  }), [deliveryStatus, fromDate, invoiceStatus, search, toDate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        getOnlineOrders({ ...params, limit: 25 }),
        getOnlineOrderSummary(params),
      ]);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
    } catch (error) {
      toast({ title: 'Online sales failed to load', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [params, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard label="Online Orders" value={summary.totals.orderCount} icon={ShoppingBag} variant="blue" />
        <StatsCard label="Revenue" value={money(summary.totals.totalRevenue)} icon={Banknote} variant="green" />
        <StatsCard label="Paid" value={money(summary.totals.paidAmount)} icon={PackageCheck} variant="sky" />
        <StatsCard label="Due" value={money(summary.totals.dueAmount)} icon={Truck} variant="red" />
      </div>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, phone, book..." className="w-[280px] pl-9" />
          </div>
          <Select value={deliveryStatus} onValueChange={(value) => setDeliveryStatus(value as DeliveryFilter)}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Delivery</SelectItem>
              {deliveryStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={invoiceStatus} onValueChange={(value) => setInvoiceStatus(value as InvoiceFilter)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Invoices</SelectItem>
              {invoiceStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <DatePicker date={fromDate} setDate={setFromDate} placeholder="From sold date" className="w-[180px]" />
          <DatePicker date={toDate} setDate={setToDate} placeholder="To sold date" className="w-[180px]" />
          <Button className="ml-auto rounded-2xl" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild className="rounded-2xl">
            <Link href="/admin/books/orders">Fulfillment</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black">Book-wise Online Sales</h3>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Book</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {summary.byBook.map((row) => (
                <TableRow key={row.bookId}>
                  <TableCell className="font-semibold">{row.bookName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.sku || '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{row.totalQty}</TableCell>
                  <TableCell className="text-right font-black">{money(row.totalRevenue)}</TableCell>
                </TableRow>
              ))}
              {summary.byBook.length === 0 ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No online sales found.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </section>

        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black">Delivery Status Breakdown</h3>
          <div className="space-y-3">
            {deliveryStatuses.map((status) => (
              <div key={status} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                <span className="text-sm font-bold">{status}</span>
                <Badge className="rounded-full">{summary.statusCounts[status] || 0}</Badge>
              </div>
            ))}
          </div>
          <h3 className="mb-4 mt-6 text-lg font-black">Invoice Status</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.invoiceStatusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="rounded-full px-3 py-1">{status}: {count}</Badge>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-black">Recent Online Orders</h3>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Sold Date</TableHead><TableHead>Student</TableHead><TableHead>Books</TableHead><TableHead>Delivery</TableHead><TableHead>Invoice</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{formatDate(order.soldAt)}</TableCell>
                <TableCell>{order.student?.fullName || order.delivery?.recipientName || 'Customer'}</TableCell>
                <TableCell className="max-w-[280px] text-sm text-muted-foreground">{order.items?.map((item) => item.book?.name || item.bookId).join(', ') || '—'}</TableCell>
                <TableCell><Badge variant="outline" className="rounded-full">{order.delivery?.deliveryStatus || 'PENDING'}</Badge></TableCell>
                <TableCell><Badge variant="outline" className="rounded-full">{order.invoice?.status || 'NO INVOICE'}</Badge></TableCell>
                <TableCell className="text-right font-black">{money(order.totalAmount)}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No recent online orders found.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
