'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, ArrowUpRight, Download, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { getFinancialDashboard, type FinancialDashboardData } from '@/lib/api/student-portal';
import { initInvoicePayment } from '@/lib/api/payment-gateway';

export default function StudentPaymentPage() {
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) { setLoading(false); return; }
      try {
        const user = JSON.parse(raw);
        if (user?.id) {
          const res = await getFinancialDashboard(user.id);
          if (res.success && res.data) setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePay = async (invoiceId: string) => {
    try {
      setPayingInvoiceId(invoiceId);
      const res = await initInvoicePayment(invoiceId);
      if (res.success && res.data?.GatewayPageURL) {
        window.location.href = res.data.GatewayPageURL;
      }
    } catch {
      setPayingInvoiceId(null);
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
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="font-bold">Unable to load payment data</p>
      </div>
    );
  }

  const { paymentHistory, summary } = data;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">পেমেন্ট</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">পেমেন্ট ইতিহাস দেখুন</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-900 px-2">পেমেন্ট তালিকা</h2>
          {paymentHistory.length === 0 ? (
            <p className="text-slate-400 font-medium px-2">কোনো পেমেন্ট নেই</p>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((inv) => {
                const isPaid = inv.status === 'PAID';
                const isDue = inv.dueAmount > 0;
                return (
                  <Card key={inv.id} className="group rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            <ArrowUpRight className="h-7 w-7" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {inv.items.map((i) => i.title).join(', ') || 'Invoice'}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              {inv.month && (
                                <>
                                  <span className="text-sm font-bold text-slate-400">{inv.month}</span>
                                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                                </>
                              )}
                              <span className="text-sm font-bold text-slate-400">
                                {new Date(inv.createdAt).toLocaleDateString('bn-BD')}
                              </span>
                              {inv.branch && (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                                  <span className="text-sm font-bold text-slate-400">{inv.branch.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-black text-slate-900">৳{inv.payableAmount}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                <Clock className="h-3 w-3" /> Due ৳{inv.dueAmount}
                              </span>
                            )}
                            {isDue && (
                              <button
                                onClick={() => handlePay(inv.id)}
                                disabled={payingInvoiceId === inv.id}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                              >
                                {payingInvoiceId === inv.id ? 'Processing…' : 'Pay Now'}
                              </button>
                            )}
                            {inv.pdfUrl && (
                              <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">সারসংক্ষেপ</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">মোট কোর্স</span>
                <span className="text-lg font-black text-slate-900">{summary.totalEnrollments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">সক্রিয় কোর্স</span>
                <span className="text-lg font-black text-emerald-600">{summary.activeEnrollments}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">মোট পরিশোধ</span>
                <span className="text-lg font-black text-slate-900">৳{summary.totalPaid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">বকেয়া</span>
                <span className="text-lg font-black text-rose-600">৳{summary.totalDue}</span>
              </div>
            </div>
          </Card>

          {data.enrollments.some(e => Number(e.monthlyDiscount) > 0 || Number(e.oneTimeDiscount) > 0) && (
            <Card className="rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">ডিসকাউন্ট</p>
              <div className="space-y-3">
                {data.enrollments
                  .filter(e => Number(e.monthlyDiscount) > 0 || Number(e.oneTimeDiscount) > 0)
                  .map((e) => (
                    <div key={e.id} className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 truncate">{e.programName}</p>
                      {Number(e.monthlyDiscount) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">মাসিক ডিসকাউন্ট</span>
                          <span className="text-sm font-black text-emerald-600">৳{Number(e.monthlyDiscount)}</span>
                        </div>
                      )}
                      {Number(e.oneTimeDiscount) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">এককালীন ডিসকাউন্ট</span>
                          <span className="text-sm font-black text-emerald-600">৳{Number(e.oneTimeDiscount)}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
