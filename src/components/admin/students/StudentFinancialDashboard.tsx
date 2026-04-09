'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  GraduationCap,
  BookOpen,
  Wallet,
  Receipt,
  Download,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getFinancialDashboard, type FinancialDashboardData } from '@/lib/api/student-portal';
import { API_ORIGIN } from '@/lib/api';

interface Props {
  studentUserId: string;
}

function money(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'WAITLISTED') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'PAUSED') return 'bg-orange-50 text-orange-700 border-orange-200';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (s === 'COMPLETED') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function getInvoiceStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'ISSUED') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'PARTIAL') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (s === 'DRAFT') return 'bg-slate-100 text-slate-500 border-slate-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function getMethodIcon(method: string) {
  const m = method.toUpperCase();
  if (m === 'CASH') return <Banknote className="h-3.5 w-3.5" />;
  if (m === 'BKASH') return <Smartphone className="h-3.5 w-3.5" />;
  if (m === 'BANK') return <CreditCard className="h-3.5 w-3.5" />;
  return <CreditCard className="h-3.5 w-3.5" />;
}

type Invoice = FinancialDashboardData['paymentHistory'][0];

function InvoiceRow({ inv }: { inv: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const pdfUrl = `${API_ORIGIN}${inv.pdfUrl}`;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">
              {inv.month ? `Month: ${inv.month}` : format(new Date(inv.createdAt), 'dd MMM yyyy')}
            </span>
            <Badge className={`text-[10px] font-black uppercase border px-2 py-0.5 ${getInvoiceStatusBadge(inv.status)}`}>
              {inv.status}
            </Badge>
            {inv.branch && (
              <span className="text-xs text-slate-400 font-medium">{inv.branch.name}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Total: <strong className="text-slate-700">৳{money(inv.totalAmount)}</strong></span>
            {inv.discountAmount > 0 && (
              <span className="text-rose-600">Discount: -৳{money(inv.discountAmount)}</span>
            )}
            {inv.scholarshipAmount > 0 && (
              <span className="text-emerald-600">Scholarship: -৳{money(inv.scholarshipAmount)}</span>
            )}
            <span>Payable: <strong className="text-slate-700">৳{money(inv.payableAmount)}</strong></span>
            <span className={inv.dueAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
              Due: ৳{money(inv.dueAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </a>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Details
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3 space-y-3">
          {/* Items */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Invoice Items</p>
            <div className="space-y-1">
              {inv.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      item.type === 'ADMISSION_FEE' ? 'bg-amber-100 text-amber-700' :
                      item.type === 'COURSE' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{item.type.replace('_', ' ')}</span>
                    {item.title}
                  </span>
                  <span className="font-bold text-slate-800">৳{money(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          {inv.payments.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Payments Received</p>
              <div className="space-y-1">
                {inv.payments.map((pay) => (
                  <div key={pay.id} className="flex items-center gap-2 text-xs text-slate-600">
                    {getMethodIcon(pay.method)}
                    <span className="font-bold text-slate-800">৳{money(Number(pay.amount))}</span>
                    <span className="text-slate-400">via {pay.method}</span>
                    {pay.trxId && <span className="text-slate-400">TRX: {pay.trxId}</span>}
                    <span className="text-slate-400 ml-auto">{format(new Date(pay.paidAt), 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StudentFinancialDashboard({ studentUserId }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFinancialDashboard(studentUserId);
      if (res.success && res.data) setData(res.data);
    } catch {
      toast({ title: 'Failed to load financial data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [studentUserId, toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, enrollments, scholarshipBreakdown, totalMonthlyScholarship, paymentHistory } = data;

  const dueInvoices = paymentHistory.filter((inv) => ['ISSUED', 'PARTIAL'].includes(inv.status));

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Enrollments', value: summary.totalEnrollments, icon: GraduationCap, color: 'indigo' },
          { label: 'Active', value: summary.activeEnrollments, icon: CheckCircle2, color: 'emerald' },
          { label: 'Waitlisted', value: summary.waitlistedEnrollments, icon: Clock, color: 'amber' },
          { label: 'Total Invoices', value: summary.totalInvoices, icon: Receipt, color: 'slate' },
          { label: 'Total Paid', value: `৳${money(summary.totalPaid)}`, icon: Wallet, color: 'emerald' },
          { label: 'Total Due', value: `৳${money(summary.totalDue)}`, icon: AlertCircle, color: summary.totalDue > 0 ? 'rose' : 'slate' },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border p-4 bg-${card.color}-50/60 border-${card.color}-100`}>
            <card.icon className={`h-5 w-5 text-${card.color}-500 mb-2`} />
            <div className={`text-lg font-black text-${card.color}-800`}>{card.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Due Invoice Alert */}
      {dueInvoices.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black text-rose-800">
              {dueInvoices.length} Outstanding Invoice{dueInvoices.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              Total due: ৳{money(summary.totalDue)}. New monthly fees will be added to existing due invoices.
            </p>
          </div>
        </div>
      )}

      {/* Enrolled Batches */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Enrolled Batches
        </h3>
        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-slate-400 text-sm">
            No enrollments found
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {enrollments.map((enr) => (
              <div key={enr.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{enr.courseName}</p>
                    <p className="text-xs text-slate-400 font-medium">{enr.courseCode}</p>
                    {enr.programName && (
                      <p className="text-xs text-indigo-500 font-medium mt-0.5">{enr.programName}</p>
                    )}
                  </div>
                  <Badge className={`shrink-0 text-[10px] font-black uppercase border px-2 py-0.5 ${getStatusBadge(enr.status)}`}>
                    {enr.status}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  {/* Batch info */}
                  {enr.batch ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold">{enr.batch.name}</span>
                      {enr.batch.capacity != null && (
                        <span className="text-slate-400">
                          ({enr.batch._count?.enrollments ?? '?'}/{enr.batch.capacity} seats)
                        </span>
                      )}
                      <Badge className={`text-[9px] font-black uppercase border px-1.5 ${getStatusBadge(enr.batch.status)}`}>
                        {enr.batch.status}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      <span>Online Course — No Batch</span>
                    </div>
                  )}

                  {/* Billing */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium capitalize">{enr.billingType.replace('_', ' ')}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold">৳{money(enr.courseFee)}</span>
                    {enr.billingType === 'MONTHLY' && <span className="text-slate-400">/mo</span>}
                  </div>

                  {/* Scholarship */}
                  {enr.recurringScholarship && enr.recurringScholarship > 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <Award className="h-3.5 w-3.5" />
                      <span className="font-bold">Recurring Scholarship: -৳{money(enr.recurringScholarship)}/mo</span>
                    </div>
                  )}

                  {/* Batch dates */}
                  {enr.batch?.startDate && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(enr.batch.startDate), 'dd MMM yyyy')}
                        {enr.batch.endDate && ` → ${format(new Date(enr.batch.endDate), 'dd MMM yyyy')}`}
                      </span>
                    </div>
                  )}

                  {/* Billing start month */}
                  {enr.billingStartMonth && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Billing from: <strong className="text-slate-600">{enr.billingStartMonth}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scholarship Breakdown */}
      {scholarshipBreakdown.length > 0 && (
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Scholarship Breakdown
          </h3>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50">
            <div className="divide-y divide-emerald-100">
              {scholarshipBreakdown.map((sch) => (
                <div key={sch.enrollmentId} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{sch.courseName}</p>
                    <p className="text-xs text-slate-400">{sch.courseCode} {sch.programName && `• ${sch.programName}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-700">-৳{money(sch.recurringScholarship)}/mo</p>
                    <Badge className={`text-[9px] font-black uppercase border px-1.5 ${getStatusBadge(sch.status)}`}>
                      {sch.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-emerald-200 bg-emerald-100/50 px-5 py-3 rounded-b-2xl">
              <span className="text-sm font-black text-emerald-800">Total Monthly Scholarship (Active)</span>
              <span className="text-base font-black text-emerald-700">-৳{money(totalMonthlyScholarship)}/mo</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Payment History
        </h3>
        {paymentHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-slate-400 text-sm">
            No invoices found
          </div>
        ) : (
          <div className="space-y-3">
            {paymentHistory.map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
