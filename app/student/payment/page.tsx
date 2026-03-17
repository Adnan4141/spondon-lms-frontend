'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, ArrowUpRight, Download, CheckCircle2, Clock } from 'lucide-react';

export default function StudentPaymentPage() {
  const transactions = [
    { id: 'TXN-001', item: 'Advanced Mathematics - Calculus II', amount: 2500, date: 'Mar 10, 2026', status: 'Completed' },
    { id: 'TXN-002', item: 'Physics E-Book - Vol 1', amount: 450, date: 'Mar 05, 2026', status: 'Completed' },
    { id: 'TXN-003', item: 'Monthly Subscription', amount: 1200, date: 'Feb 28, 2026', status: 'Pending' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">পেমেন্ট</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">পেমেন্ট ইতিহাস দেখুন</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-5 py-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-black uppercase tracking-widest">Active Plan: Premium</span>
           </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black text-slate-900 px-2">পেমেন্ট তালিকা</h2>
            <div className="space-y-4">
               {transactions.map((txn) => (
                  <Card key={txn.id} className="group rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                     <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                           <div className="flex items-center gap-6">
                              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${txn.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                 <ArrowUpRight className="h-7 w-7" />
                              </div>
                              <div className="space-y-1">
                                 <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{txn.item}</h3>
                                 <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-400">{txn.id}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                    <span className="text-sm font-bold text-slate-400">{txn.date}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                              <p className="text-2xl font-black text-slate-900">৳{txn.amount}</p>
                              <div className="flex items-center gap-2">
                                 {txn.status === 'Completed' ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                       <CheckCircle2 className="h-3 w-3" /> {txn.status}
                                    </span>
                                 ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                       <Clock className="h-3 w-3" /> {txn.status}
                                    </span>
                                 )}
                                 <button className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                                    <Download className="h-4 w-4" />
                                 </button>
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>

         <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-none bg-slate-900 p-10 text-white shadow-2xl shadow-slate-200">
               <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mb-4">কার্ড</p>
               <div className="space-y-8">
                  <div className="flex justify-between items-start">
                     <CreditCard className="h-10 w-10 text-white" />
                     <span className="text-xs font-bold text-slate-400">VISA</span>
                  </div>
                  <p className="text-xl font-bold tracking-[0.2em]">**** **** **** 4242</p>
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Holder</p>
                        <p className="font-bold text-sm text-slate-200">ADNAN HASAN</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expires</p>
                        <p className="font-bold text-sm text-slate-200">12/28</p>
                     </div>
                  </div>
               </div>
            </Card>

            <button className="w-full py-5 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-black hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
               Add Payment Method
            </button>
         </div>
      </div>
    </div>
  );
}
