'use client';

import { useState, useEffect } from 'react';
import { createBranch, updateBranch, type Branch, type CreateBranchDto, type UpdateBranchDto } from '@/lib/api/branches';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, MapPin, Phone, Hash, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

interface BranchFormProps {
  branch?: Branch | null;
  onSuccess: () => Promise<void>;
}

export function BranchForm({ branch, onSuccess }: BranchFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  
  const [form, setForm] = useState<CreateBranchDto>({
    name: '',
    code: '',
    address: '',
    phone: '',
    status: 'active',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!branch;

  useEffect(() => {
    if (branch) {
      setForm({
        name: branch.name,
        code: branch.code || '',
        address: branch.address || '',
        phone: branch.phone || '',
        status: branch.status,
      });
    }
  }, [branch]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Branch name is required for institutional identification.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        status: form.status,
      };

      if (isEdit && branch) {
        await updateBranch(branch.id, payload as UpdateBranchDto);
      } else {
        await createBranch(payload as CreateBranchDto);
      }
      
      toast({
        title: 'Success',
        description: `Branch ${isEdit ? 'updated' : 'initialized'} successfully`,
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
          {/* Core Identity */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Branch Identity</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                   <label className={sectionLabel}>Branch Legal Name</label>
                   <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Downtown Campus" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Branch Code</label>
                   <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., DTC-01" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Operational Status</label>
                   <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         <SelectItem value="active" className="text-sm font-medium">ACTIVE</SelectItem>
                         <SelectItem value="inactive" className="text-sm font-medium">INACTIVE</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </section>

          {/* Contact & Location */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Location & Contact</h3>
             </div>
             <div className="grid gap-6">
                <div className="space-y-2">
                   <label className={sectionLabel}>Contact Phone</label>
                   <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+880 XXXXX-XXXXXX" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Physical Address</label>
                   <textarea 
                     className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner" 
                     rows={3} 
                     value={form.address} 
                     onChange={e => setForm(p => ({ ...p, address: e.target.value }))} 
                     placeholder="Complete physical address of the branch..." 
                   />
                </div>
             </div>
          </section>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
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
            {submitting ? 'Processing...' : isEdit ? 'Commit Updates' : 'Initialize Branch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
