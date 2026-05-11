'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Loader2, WalletCards } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getFinancialDashboard,
  type FinancialDashboardData,
  type FinancialDashboardInvoice,
} from '@/lib/api/student-portal';
import { initInvoicePayment } from '@/lib/api/payment-gateway';
import { openInvoicePdfInNewTab } from '@/lib/api/invoices';

type ProgramPayment = NonNullable<FinancialDashboardData['programPayments']>[number];
type FilterKey = 'ALL' | 'MONTHLY' | 'ONE_TIME' | 'DUE';

function money(value: number | string) {
  return `৳${Number(value || 0).toLocaleString('en-BD')}`;
}

function fmtMonth(value?: string | null) {
  if (!value) return 'One-time';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1).toLocaleString('en', { month: 'short', year: 'numeric' });
}

function statusLabel(status: string, dueAmount: number) {
  if (dueAmount <= 0 || status === 'PAID') return 'Fully Paid';
  if (status === 'PARTIAL') return 'Partial';
  return 'Due';
}

function fallbackProgramPayments(data: FinancialDashboardData): ProgramPayment[] {
  if (data.programPayments?.length) return data.programPayments;
  return data.enrollments.map((enrollment) => {
    const invoices = data.paymentHistory.filter((invoice) =>
      invoice.items.some((item) => item.type === 'COURSE' && item.title.includes(enrollment.courseName)),
    );
    return {
      programId: enrollment.courseId,
      programName: enrollment.programName || enrollment.courseName,
      billingType: enrollment.billingType,
      enrollmentId: enrollment.id,
      status: enrollment.status,
      branch: enrollment.branch,
      courses: [{ id: enrollment.courseId, name: enrollment.courseName, type: enrollment.courseType, batch: enrollment.batch }],
      payableAmount: invoices.reduce((sum, invoice) => sum + invoice.payableAmount, 0),
      paidAmount: invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0),
      dueAmount: invoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0),
      invoices,
      monthGroups: enrollment.billingType === 'MONTHLY'
        ? invoices.map((invoice) => ({
            month: invoice.month || 'Unassigned',
            payableAmount: invoice.payableAmount,
            paidAmount: invoice.paidAmount,
            dueAmount: invoice.dueAmount,
            status: invoice.status,
            invoices: [invoice],
          }))
        : [],
    };
  });
}

export default function StudentPaymentPage() {
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) { setLoading(false); return; }
      try {
        const user = JSON.parse(raw) as { id?: string };
        if (user?.id) {
          const res = await getFinancialDashboard(user.id);
          if (res.success && res.data) setData(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const programPayments = useMemo(() => data ? fallbackProgramPayments(data) : [], [data]);
  const visiblePrograms = useMemo(() => {
    return programPayments.filter((program) => {
      if (filter === 'MONTHLY') return program.billingType === 'MONTHLY';
      if (filter === 'ONE_TIME') return program.billingType === 'ONE_TIME';
      if (filter === 'DUE') return program.dueAmount > 0;
      return true;
    });
  }, [filter, programPayments]);

  const handlePay = async (invoiceId: string) => {
    try {
      setPayingInvoiceId(invoiceId);
      const res = await initInvoicePayment(invoiceId);
      if (res.success && res.data?.GatewayPageURL) {
        window.location.href = res.data.GatewayPageURL;
      }
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleOpenInvoicePdf = async (invoiceId: string) => {
    try {
      setPdfLoadingId(invoiceId);
      await openInvoicePdfInNewTab(invoiceId);
    } finally {
      setPdfLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <AlertTriangle className="mb-3 h-10 w-10" />
        <p className="font-bold">Unable to load payment data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Payments</h1>
          <p className="mt-2 text-lg font-medium text-slate-500">Review payments by program and month.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <SummaryPill label="Programs" value={programPayments.length} />
          <SummaryPill label="Paid" value={money(data.summary.totalPaid)} />
          <SummaryPill label="Due" value={money(data.summary.totalDue)} tone="due" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['ALL', 'All'],
          ['MONTHLY', 'Monthly'],
          ['ONE_TIME', 'One-Time'],
          ['DUE', 'Due'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key as FilterKey)}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-black transition-colors',
              filter === key
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visiblePrograms.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed border-slate-200 bg-white">
          <CardContent className="p-10 text-center">
            <WalletCards className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-black text-slate-700">No payment records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {visiblePrograms.map((program) => (
            <ProgramPaymentCard
              key={program.enrollmentId}
              program={program}
              payingInvoiceId={payingInvoiceId}
              pdfLoadingId={pdfLoadingId}
              onPay={handlePay}
              onPdf={handleOpenInvoicePdf}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string | number; tone?: 'due' }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 text-right">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={cn('truncate text-sm font-black text-slate-900', tone === 'due' && 'text-rose-600')}>{value}</p>
    </div>
  );
}

function ProgramPaymentCard({
  program,
  payingInvoiceId,
  pdfLoadingId,
  onPay,
  onPdf,
}: {
  program: ProgramPayment;
  payingInvoiceId: string | null;
  pdfLoadingId: string | null;
  onPay: (invoiceId: string) => Promise<void>;
  onPdf: (invoiceId: string) => Promise<void>;
}) {
  const isMonthly = program.billingType === 'MONTHLY';
  const rows = isMonthly
    ? program.monthGroups.map((group) => ({
        key: `${program.enrollmentId}-${group.month}`,
        title: fmtMonth(group.month),
        subtitle: 'Monthly invoice',
        payableAmount: group.payableAmount,
        paidAmount: group.paidAmount,
        dueAmount: group.dueAmount,
        status: group.status,
        invoices: group.invoices,
      }))
    : program.invoices.map((invoice) => ({
        key: invoice.id,
        title: invoice.month ? fmtMonth(invoice.month) : 'Program invoice',
        subtitle: invoice.items.map((item) => item.title).join(', ') || 'Invoice',
        payableAmount: invoice.payableAmount,
        paidAmount: invoice.paidAmount,
        dueAmount: invoice.dueAmount,
        status: invoice.status,
        invoices: [invoice],
      }));

  return (
    <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                isMonthly ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700',
              )}>
                {isMonthly ? 'Monthly Program' : 'One-Time Program'}
              </span>
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                program.dueAmount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
              )}>
                {program.dueAmount > 0 ? 'Due' : 'Fully Paid'}
              </span>
            </div>
            <h2 className="truncate text-xl font-black text-slate-900">{program.programName}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {program.courses.map((course) => course.name).join(', ') || 'No course listed'}
              {program.branch?.name ? ` · ${program.branch.name}` : ''}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:min-w-[320px]">
            <SummaryPill label="Payable" value={money(program.payableAmount)} />
            <SummaryPill label="Paid" value={money(program.paidAmount)} />
            <SummaryPill label="Due" value={money(program.dueAmount)} tone="due" />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <div className="p-5 text-sm font-semibold text-slate-400">No invoice has been issued for this program yet.</div>
          ) : (
            rows.map((row) => (
              <PaymentRow
                key={row.key}
                title={row.title}
                subtitle={row.subtitle}
                payableAmount={row.payableAmount}
                paidAmount={row.paidAmount}
                dueAmount={row.dueAmount}
                status={row.status}
                invoices={row.invoices}
                payingInvoiceId={payingInvoiceId}
                pdfLoadingId={pdfLoadingId}
                onPay={onPay}
                onPdf={onPdf}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentRow({
  title,
  subtitle,
  payableAmount,
  paidAmount,
  dueAmount,
  status,
  invoices,
  payingInvoiceId,
  pdfLoadingId,
  onPay,
  onPdf,
}: {
  title: string;
  subtitle: string;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  invoices: FinancialDashboardInvoice[];
  payingInvoiceId: string | null;
  pdfLoadingId: string | null;
  onPay: (invoiceId: string) => Promise<void>;
  onPdf: (invoiceId: string) => Promise<void>;
}) {
  const payableInvoice = invoices.find((invoice) => invoice.dueAmount > 0) ?? invoices[0];
  return (
    <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_380px] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black text-slate-900">{title}</h3>
          <span className={cn(
            'rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest',
            dueAmount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
          )}>
            {statusLabel(status, dueAmount)}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid grid-cols-3 gap-2">
          <SummaryPill label="Payable" value={money(payableAmount)} />
          <SummaryPill label="Paid" value={money(paidAmount)} />
          <SummaryPill label="Due" value={money(dueAmount)} tone="due" />
        </div>
        <div className="flex justify-end gap-2">
          {payableInvoice?.dueAmount > 0 ? (
            <button
              type="button"
              onClick={() => onPay(payableInvoice.id)}
              disabled={payingInvoiceId === payableInvoice.id}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {payingInvoiceId === payableInvoice.id ? 'Processing...' : 'Pay Now'}
            </button>
          ) : (
            <span className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Paid
            </span>
          )}
          {payableInvoice ? (
            <button
              type="button"
              title="Invoice PDF"
              onClick={() => onPdf(payableInvoice.id)}
              disabled={pdfLoadingId === payableInvoice.id}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-50"
            >
              {pdfLoadingId === payableInvoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
