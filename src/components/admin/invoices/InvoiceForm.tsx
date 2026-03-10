'use client';

import { useState, useEffect } from 'react';
import { createInvoice, updateInvoice } from '@/lib/api/invoices';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, CreateInvoiceDto, CreateInvoiceItemDto, UpdateInvoiceDto, InvoiceStatus, InvoiceItemType } from '@/types/invoice';
import type { Branch } from '@/lib/api/branches';
import type { Student } from '@/lib/api/students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldCheck, Calendar, Activity, GraduationCap, Building2, Plus, Trash2, CreditCard, Hash, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

const itemTypeOptions: InvoiceItemType[] = ['COURSE', 'BOOK', 'FEE', 'OTHER'];
const statusOptions: InvoiceStatus[] = ['DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED'];

interface InvoiceFormProps {
  branches: Branch[];
  students: Student[];
  invoice?: Invoice | null;
  onSuccess: () => Promise<void>;
}

export function InvoiceForm({ branches, students, invoice, onSuccess }: InvoiceFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  
  const isEdit = !!invoice;
  
  const [form, setForm] = useState<CreateInvoiceDto>({
    studentUserId: '',
    branchId: '',
    month: '',
    status: 'DRAFT',
    discountAmount: 0,
    scholarshipAmount: 0,
    items: [],
  });
  
  const [items, setItems] = useState<CreateInvoiceItemDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      setForm({
        studentUserId: invoice.studentUserId,
        branchId: invoice.branchId,
        month: invoice.month || '',
        status: invoice.status,
        discountAmount: Number(invoice.discountAmount),
        scholarshipAmount: Number(invoice.scholarshipAmount),
        items: [], // Items are handled differently for edit in API usually, but here we only allow status/adjustments as per original code
      });
    }
  }, [invoice]);

  const addItem = () => {
    setItems([...items, { type: 'COURSE', title: '', qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof CreateInvoiceItemDto, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const discount = form.discountAmount || 0;
    const scholarship = form.scholarshipAmount || 0;
    const total = subtotal - discount - scholarship;
    return { subtotal, total };
  };

  const handleSubmit = async () => {
    if (!isEdit && (!form.studentUserId || !form.branchId || items.length === 0)) {
      setError('Student, branch, and at least one item are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      if (isEdit && invoice) {
        const payload: UpdateInvoiceDto = {
          status: form.status,
          discountAmount: form.discountAmount,
          scholarshipAmount: form.scholarshipAmount,
        };
        await updateInvoice(invoice.id, payload);
      } else {
        await createInvoice({ ...form, items });
      }
      
      toast({
        title: 'Success',
        description: `Invoice ${isEdit ? 'updated' : 'initialized'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      setError(err.message || 'Processing failed');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="space-y-10">
          {/* Header Context */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Billing Context</h3>
             </div>
             
             {!isEdit ? (
                <div className="grid gap-6 sm:grid-cols-2">
                   <div className="space-y-2">
                      <label className={sectionLabel}>Target Student</label>
                      <Select value={form.studentUserId} onValueChange={v => setForm(p => ({ ...p, studentUserId: v }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                            <SelectValue placeholder="Select Student" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            {students.map(s => <SelectItem key={s.id} value={s.id} className="font-bold text-xs uppercase tracking-widest py-3">{s.fullName} ({s.mobile})</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <label className={sectionLabel}>Billing Branch</label>
                      <Select value={form.branchId} onValueChange={v => setForm(p => ({ ...p, branchId: v }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                            <SelectValue placeholder="Select Branch" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold text-xs uppercase tracking-widest py-3">{b.name}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
             ) : (
                <div className="rounded-[32px] border border-slate-100 bg-slate-50/50 p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                         {invoice?.student?.fullName.charAt(0)}
                      </div>
                      <div>
                         <h4 className="text-base font-black text-slate-900">{invoice?.student?.fullName}</h4>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice ID: {invoice?.id.slice(0, 12)}</p>
                      </div>
                   </div>
                   <Badge variant="outline" className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border-slate-200">{invoice?.status}</Badge>
                </div>
             )}

             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Billing Month (YYYY-MM)</label>
                   <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        className={cn(inputClass, "pl-11")} 
                        type="month" 
                        value={form.month} 
                        onChange={e => setForm(p => ({ ...p, month: e.target.value }))} 
                        disabled={isEdit}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Status Control</label>
                   <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as InvoiceStatus }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {statusOptions.map(s => <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-widest py-3">{s}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </section>

          {/* Line Items */}
          {!isEdit && (
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Activity className="h-4 w-4 text-emerald-600" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Statement Items</h3>
                  </div>
                  <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50" onClick={addItem}>
                     <Plus className="mr-2 h-4 w-4" />
                     Add Ledger Item
                  </Button>
               </div>

               <div className="space-y-4">
                  {items.map((item, idx) => (
                     <div key={idx} className="group relative rounded-[28px] border border-slate-100 bg-slate-50/30 p-5 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/40">
                        <div className="grid gap-4 sm:grid-cols-12 items-end">
                           <div className="sm:col-span-3 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase px-1">Item Type</label>
                              <Select value={item.type} onValueChange={v => updateItem(idx, 'type', v as InvoiceItemType)}>
                                 <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs shadow-sm">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    {itemTypeOptions.map(opt => <SelectItem key={opt} value={opt} className="text-xs font-bold uppercase py-2">{opt}</SelectItem>)}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="sm:col-span-5 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase px-1">Descriptor</label>
                              <Input className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs shadow-sm" placeholder="e.g., Monthly Tuition" value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)} />
                           </div>
                           <div className="sm:col-span-2 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase px-1">Qty</label>
                              <Input type="number" className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs shadow-sm" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} />
                           </div>
                           <div className="sm:col-span-2 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase px-1">Unit Price</label>
                              <Input type="number" className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs shadow-sm" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                           </div>
                        </div>
                        <Button variant="outline" size="icon" className="absolute -right-3 -top-3 h-8 w-8 rounded-xl bg-white border-slate-100 text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 opacity-0 group-hover:opacity-100 transition-all shadow-sm" onClick={() => removeItem(idx)}>
                           <X className="h-3.5 w-3.5" />
                        </Button>
                     </div>
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 rounded-[32px] border border-dashed border-slate-200 bg-slate-50/50">
                       <CreditCard className="h-8 w-8 text-slate-300 mb-3" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statement ledger is empty</p>
                    </div>
                  )}
               </div>
            </section>
          )}

          {/* Adjustments & Totals */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Financial Resolution</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Global Discount (৳)</label>
                   <Input type="number" className={inputClass} value={form.discountAmount} onChange={e => setForm(p => ({ ...p, discountAmount: Number(e.target.value) }))} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Scholarship Grant (৳)</label>
                   <Input type="number" className={inputClass} value={form.scholarshipAmount} onChange={e => setForm(p => ({ ...p, scholarshipAmount: Number(e.target.value) }))} placeholder="0.00" />
                </div>
             </div>

             <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200">
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Gross Subtotal</span>
                      <span className="text-sm font-bold">৳{Number(calculateTotals().subtotal).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-rose-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Adjustments</span>
                      <span className="text-sm font-bold">-৳{Number((form.discountAmount || 0) + (form.scholarshipAmount || 0)).toLocaleString()}</span>
                   </div>
                   <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                      <div className="flex flex-col">
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">Net Payable Amount</span>
                         <span className="text-[10px] font-bold text-slate-500 italic">Institutional liability after grants</span>
                      </div>
                      <span className="text-3xl font-black tracking-tighter">৳{Number(calculateTotals().total).toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </section>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={closeModal}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Commit Updates' : 'Authorize Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
}
