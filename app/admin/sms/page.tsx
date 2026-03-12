'use client';

import React, { useEffect, useState } from 'react';
import { 
  getSmsConfig, 
  upsertSmsConfig, 
  getSmsTemplates, 
  sendDirectSms, 
  getCampaigns,
  getCampaignPreview,
  createCampaign,
  runCampaign,
  getSmsBalance,
  transferSmsBalance,
  getSmsLogs,
  SmsConfig, 
  SmsTemplate 
} from '@/lib/api/sms';
import { getPrograms } from '@/lib/api/programs';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Settings, 
  FileText, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  ShieldCheck,
  Plus,
  Users,
  Target,
  Megaphone,
  Zap,
  Calendar,
  Database,
  Layers,
  ArrowRight,
  History,
  MessageSquare,
  Globe,
  Activity,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toast';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-white px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-sm';
const cardClass = 'rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 transition-all';
const labelClass = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block px-1';

export default function SmsManagementPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal } = useModalStore();
  
  const [config, setConfig] = useState<Partial<SmsConfig>>({
    provider: 'BulkSMSBD',
    apiKey: '',
    senderId: '',
    nonMaskingNumber: '',
    isActive: true
  });
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Balance Transfer State
  const [transfer, setTransfer] = useState({
    branchId: '',
    count: 0
  });

  // Direct Send State
  const [directSend, setDirectSend] = useState({
    to: '',
    message: '',
    isMasking: false
  });

  // Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    type: 'NOTICE',
    branchId: 'all',
    programId: 'all',
    batchId: 'all',
    targetMonth: '',
    message: '',
    isMasking: true
  });

  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, templatesRes, campaignsRes, progRes, branchRes, balanceRes, logsRes] = await Promise.all([
        getSmsConfig(),
        getSmsTemplates(),
        getCampaigns(),
        getPrograms(),
        getBranches(),
        getSmsBalance(),
        getSmsLogs(1, 20)
      ]);

      if (configRes.success && configRes.data) setConfig(configRes.data);
      if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data);
      if (campaignsRes.success && campaignsRes.data) setCampaigns(campaignsRes.data);
      if (progRes.success && progRes.data) setPrograms(progRes.data);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
      if (balanceRes.success && balanceRes.data) setBalances(balanceRes.data);
      if (logsRes.success && logsRes.data) setSmsLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchesForFilter = async (programId: string) => {
    if (programId === 'all') {
      setBatches([]);
      return;
    }
    const res = await getBatches({ programId });
    if (res.success && res.data) setBatches(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updatePreview = async () => {
    try {
      const payload = {
        type: newCampaign.type,
        branchId: newCampaign.branchId === 'all' ? undefined : newCampaign.branchId,
        programId: newCampaign.programId === 'all' ? undefined : newCampaign.programId,
        batchId: newCampaign.batchId === 'all' ? undefined : newCampaign.batchId,
        targetMonth: newCampaign.targetMonth || undefined
      };
      const res = await getCampaignPreview(payload);
      if (res.success) setPreviewCount(res.data.count);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!loading) updatePreview();
  }, [newCampaign.type, newCampaign.branchId, newCampaign.programId, newCampaign.batchId, newCampaign.targetMonth]);

  const handleSaveConfig = async () => {
    try {
      setSubmitting(true);
      const res = await upsertSmsConfig(config);
      if (res.success) {
        toast({ title: 'System Updated', description: 'SMS infrastructure configuration secured', variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDirect = async () => {
    if (!directSend.to || !directSend.message) {
      toast({ title: 'Incomplete Request', description: 'Identity and content parameters required', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await sendDirectSms(directSend.to, directSend.message, directSend.isMasking);
      if (res.success) {
        toast({ title: 'Transmission Authorized', description: 'Communication successfully dispatched', variant: 'success' });
        setDirectSend({ ...directSend, to: '', message: '' });
        loadData();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!transfer.branchId || transfer.count <= 0) {
      toast({ title: 'Invalid Allocation', description: 'Please select a branch and positive count', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await transferSmsBalance(transfer.branchId, transfer.count);

      if (res.success) {
        toast({ title: 'Allocation Authorized', description: `Successfully assigned ${transfer.count} credits`, variant: 'success' });
        loadData();
        setTransfer({ branchId: '', count: 0 });
      }
    } catch (err: any) {
      toast({ title: 'Allocation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndRunCampaign = async () => {
    if (!newCampaign.message) {
      toast({ title: 'Error', description: 'Campaign message is required', variant: 'destructive' });
      return;
    }

    openModal({
      title: 'Initialize Campaign Transmission',
      description: `Dispatching ${newCampaign.type} communication to ${previewCount || 0} identified recipients. Status will be logged in real-time.`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Transmission"
          description="Are you sure you want to trigger this mass communication protocol?"
          variant="primary"
          onConfirm={async () => {
            try {
              setSubmitting(true);
              const createRes = await createCampaign({
                type: newCampaign.type,
                scope: 'ORG',
                branchId: newCampaign.branchId === 'all' ? undefined : newCampaign.branchId,
                programId: newCampaign.programId === 'all' ? undefined : newCampaign.programId,
                batchId: newCampaign.batchId === 'all' ? undefined : newCampaign.batchId,
                targetMonth: newCampaign.targetMonth || undefined,
                messageOverride: newCampaign.message,
                status: 'DRAFT'
              });

              if (createRes.success && createRes.data) {
                const runRes = await runCampaign(createRes.data.id, newCampaign.isMasking);
                if (runRes.success) {
                  toast({ title: 'Transmission Complete', description: 'Campaign executed successfully', variant: 'success' });
                  loadData();
                  setNewCampaign({ ...newCampaign, message: '' });
                }
              }
            } catch (err: any) {
              toast({ title: 'Critical Error', description: err.message, variant: 'destructive' });
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )
    });
  };

  const handleViewLogDetails = (log: any) => {
    openModal({
      title: 'Communication Intelligence Audit',
      description: `Analyzing transmission matrix for campaign ID: ${log.id.slice(0, 12)}`,
      className: 'sm:max-w-3xl',
      content: (
        <div className="space-y-8 p-4">
           <div className="grid grid-cols-3 gap-6">
              <div className="rounded-[24px] bg-slate-50 p-6 border border-slate-100 shadow-sm text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Pool</p>
                 <p className="text-3xl font-black text-slate-900 tracking-tighter">{log.recipientCount}</p>
              </div>
              <div className="rounded-[24px] bg-indigo-50 p-6 border border-indigo-100 shadow-sm text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Delivered</p>
                 <p className="text-3xl font-black text-indigo-600 tracking-tighter">{log.successCount}</p>
              </div>
              <div className="rounded-[24px] bg-rose-50 p-6 border border-rose-100 shadow-sm text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">Suppressed</p>
                 <p className="text-3xl font-black text-rose-600 tracking-tighter">{log.failedCount}</p>
              </div>
           </div>

           <div className="rounded-[32px] border border-slate-200 overflow-hidden bg-white shadow-xl shadow-slate-200/20">
              <table className="w-full text-sm">
                 <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                       <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Mobile Identity</th>
                       <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                       <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">System Log</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 font-medium">
                    {log.recipients?.map((r: any) => (
                       <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-700">{r.mobile}</td>
                          <td className="px-6 py-4">
                             <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full", r.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                {r.status}
                             </Badge>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic">
                             {r.error || 'SUCCESSFUL_TRANSMISSION'}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )
    });
  };

  const orgBalance = balances.find(b => b.scope === 'ORG')?.balanceCount || 0;

  if (loading) {
    return <div className="flex h-96 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-10 text-slate-900 pb-20 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Communication Console</h1>
          <p className="text-base font-bold text-indigo-500/80 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Institutional SMS Gateway & Distributed Balance Network
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={loadData} className="h-12 w-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
              <RefreshCw className={cn("h-5 w-5 text-slate-400", submitting && "animate-spin")} />
           </Button>
           <div className="h-12 px-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Gateway Active</span>
           </div>
        </div>
      </header>

      {/* Balance Matrix */}
      <section className="grid gap-8 lg:grid-cols-3">
         {/* Organization Balance Card */}
         <div className="lg:col-span-1 group relative overflow-hidden rounded-[40px] bg-white border border-slate-200 p-10 shadow-2xl shadow-indigo-100/50 transition-all hover:shadow-indigo-200/50">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-indigo-50/50 blur-3xl group-hover:bg-indigo-100/50 transition-colors" />
            
            <div className="relative space-y-8">
               <div className="flex items-center justify-between">
                  <div className="h-14 w-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
                     <Database className="h-7 w-7" />
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[10px] uppercase px-3 py-1">ORG_RESERVE</Badge>
               </div>

               <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Institutional Credit Matrix</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-6xl font-black tracking-tighter text-slate-900">{orgBalance.toLocaleString()}</span>
                     <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Units</span>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100 space-y-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Credit Allocation Protocol</p>
                  <div className="space-y-3">
                     <Select value={transfer.branchId} onValueChange={v => setTransfer({...transfer, branchId: v})}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold text-slate-700 shadow-inner focus:bg-white transition-all">
                           <SelectValue placeholder="Target Regional Branch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                           {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">{b.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                     <Input 
                        type="number" 
                        placeholder="Amount to Assign" 
                        value={transfer.count || ''} 
                        onChange={e => setTransfer({...transfer, count: parseInt(e.target.value) || 0})}
                        className={inputClass}
                     />
                     <Button 
                        onClick={handleTransfer} 
                        disabled={submitting} 
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200 transition-all active:scale-95"
                     >
                        Initialize Allocation
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* Branch Balances Table */}
         <div className="lg:col-span-2 rounded-[40px] bg-white border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                     <Layers className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Regional Distribution</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Branch Asset Registry</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                  <Activity className="h-3 w-3 text-emerald-500" />
                  {balances.filter(b => b.scope === 'BRANCH').length} Regional Nodes
               </div>
            </div>
            <div className="overflow-y-auto max-h-[400px] no-scrollbar">
               <table className="w-full">
                  <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                     <tr className="border-b border-slate-100">
                        <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Branch Identity</th>
                        <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Allocated Credits</th>
                        <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {balances.filter(b => b.scope === 'BRANCH').map(b => (
                        <tr key={b.id} className="group hover:bg-indigo-50/30 transition-colors">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                    {b.branch?.name.charAt(0)}
                                 </div>
                                 <span className="text-base font-black text-slate-700">{b.branch?.name}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <span className="text-xl font-black text-slate-900 tracking-tighter">{b.balanceCount.toLocaleString()}</span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <div className={cn(
                                 "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                 b.balanceCount > 500 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                              )}>
                                 <span className={cn("h-1.5 w-1.5 rounded-full", b.balanceCount > 500 ? "bg-emerald-500" : "bg-amber-500")} />
                                 {b.balanceCount > 500 ? 'Operational' : 'Low_Credit'}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </section>

      {/* Main Campaign and Config Matrix */}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
         <div className="space-y-8">
            {/* Campaign Engine */}
            <section className={cardClass}>
               <div className="mb-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                        <Megaphone className="h-7 w-7" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Architecture</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unified Communication Protocol</p>
                     </div>
                  </div>
                  {previewCount !== null && (
                     <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 shadow-xl shadow-slate-200 animate-in zoom-in duration-500">
                           <Users className="h-4 w-4 text-emerald-400" />
                           <span className="text-sm font-black text-white uppercase tracking-widest">{previewCount} Targets Identified</span>
                        </div>
                     </div>
                  )}
               </div>

               <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className={labelClass}>Transmission Mode</label>
                        <Select value={newCampaign.type} onValueChange={v => setNewCampaign({...newCampaign, type: v})}>
                           <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold shadow-inner">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl shadow-xl">
                              <SelectItem value="NOTICE" className="font-bold py-3">General Notice Protocol</SelectItem>
                              <SelectItem value="DUE" className="font-bold py-3">Tuition Arrears Reminder</SelectItem>
                              <SelectItem value="BIRTHDAY" className="font-bold py-3">Anniversary Salutation</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <label className={labelClass}>Regional Filter</label>
                        <Select value={newCampaign.branchId} onValueChange={v => setNewCampaign({...newCampaign, branchId: v})}>
                           <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold shadow-inner">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl shadow-xl">
                              <SelectItem value="all" className="font-bold py-3">Global (All Regional Branches)</SelectItem>
                              {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">{b.name}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                           <label className={labelClass}>Academic Program</label>
                           <Select value={newCampaign.programId} onValueChange={v => {
                              setNewCampaign({...newCampaign, programId: v, batchId: 'all'});
                              loadBatchesForFilter(v);
                           }}>
                              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold shadow-inner">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl shadow-xl">
                                 <SelectItem value="all" className="font-bold py-3">All Programs</SelectItem>
                                 {programs.map(p => <SelectItem key={p.id} value={p.id} className="font-bold py-3">{p.name}</SelectItem>)}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <label className={labelClass}>Specific Batch</label>
                           <Select value={newCampaign.batchId} onValueChange={v => setNewCampaign({...newCampaign, batchId: v})} disabled={newCampaign.programId === 'all'}>
                              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold shadow-inner">
                                 <SelectValue placeholder="Batch" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl shadow-xl">
                                 <SelectItem value="all" className="font-bold py-3">All Batches</SelectItem>
                                 {batches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">{b.name}</SelectItem>)}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     {newCampaign.type === 'DUE' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                           <label className={labelClass}>Due Resolution Month</label>
                           <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input type="month" className={cn(inputClass, "bg-slate-50/50 pl-11")} value={newCampaign.targetMonth} onChange={e => setNewCampaign({...newCampaign, targetMonth: e.target.value})} />
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <div className="flex items-center justify-between px-1 mb-2">
                           <label className={labelClass}>Communication Matrix</label>
                           <div className="flex items-center gap-3 rounded-full bg-slate-50 border border-slate-100 px-3 py-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Masking</span>
                              <Switch checked={newCampaign.isMasking} onCheckedChange={v => setNewCampaign({...newCampaign, isMasking: v})} />
                           </div>
                        </div>
                        <Textarea 
                           className="min-h-[220px] rounded-[32px] border-slate-200 bg-slate-50/50 p-8 font-bold text-slate-700 shadow-inner focus:bg-white transition-all leading-relaxed"
                           placeholder="Synthesize transmission payload..."
                           value={newCampaign.message}
                           onChange={e => setNewCampaign({...newCampaign, message: e.target.value})}
                        />
                     </div>
                     
                     <Button 
                        onClick={handleCreateAndRunCampaign}
                        disabled={submitting || !previewCount}
                        className="h-16 w-full rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
                     >
                        <Zap className="mr-3 h-5 w-5 fill-white" />
                        Execute Protocol Dispatch
                     </Button>
                  </div>
               </div>
            </section>

            {/* History Console */}
            <section className="rounded-[40px] bg-white border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
               <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <History className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Transmission Logs</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Communication Matrix</p>
                     </div>
                  </div>
                  <Badge variant="outline" className="bg-white border-slate-200 text-indigo-600 font-black px-4 py-1.5 rounded-xl shadow-sm uppercase tracking-widest text-[9px]">{smsLogs.length} Entries</Badge>
               </div>
               
               <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto no-scrollbar">
                  {smsLogs.map(log => (
                     <div key={log.id} className="group p-8 flex items-center justify-between hover:bg-slate-50/80 transition-all cursor-pointer" onClick={() => handleViewLogDetails(log)}>
                        <div className="flex items-center gap-6">
                           <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                              log.failedCount > 0 ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                           )}>
                              <MessageSquare className="h-6 w-6" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-lg font-black text-slate-800 tracking-tight line-clamp-1">{log.message}</p>
                              <div className="flex items-center gap-3">
                                 <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(log.createdAt).toLocaleDateString()}
                                 </span>
                                 <span className="h-1 w-1 rounded-full bg-slate-300" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.recipientCount} Targets</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                           <div className="text-right space-y-1">
                              <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">%{Math.round((log.successCount/(log.recipientCount || 1))*100) || 0} Delivered</p>
                              <p className="text-[10px] font-bold text-slate-400 tracking-widest">PAYLOAD_COST: ৳{log.cost || 0}</p>
                           </div>
                           <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shadow-sm">
                              <ArrowRight className="h-5 w-5" />
                           </div>
                        </div>
                     </div>
                  ))}
                  {smsLogs.length === 0 && (
                     <div className="p-24 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Communication Repository is Empty</p>
                     </div>
                  )}
               </div>
            </section>
         </div>

         <aside className="space-y-8">
            {/* Quick Send Interface */}
            <section className={cardClass}>
               <div className="mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                     <Send className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Direct Link</h2>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                           "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all",
                           directSend.isMasking ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border border-slate-200"
                        )}>
                           {directSend.isMasking ? <ShieldCheck className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Masking Mode</p>
                           <p className="text-[9px] font-bold text-slate-500 uppercase italic">
                              {directSend.isMasking ? config.senderId : config.nonMaskingNumber || 'NUMERIC_ID'}
                           </p>
                        </div>
                     </div>
                     <Switch checked={directSend.isMasking} onCheckedChange={v => setDirectSend({...directSend, isMasking: v})} />
                  </div>

                  <div className="space-y-2">
                     <label className={labelClass}>Target Mobile</label>
                     <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input value={directSend.to} onChange={e => setDirectSend({...directSend, to: e.target.value})} placeholder="017XXXXXXXX" className={cn(inputClass, "pl-11")} />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className={labelClass}>Immediate Message</label>
                     <Textarea 
                        value={directSend.message} 
                        onChange={e => setDirectSend({...directSend, message: e.target.value})} 
                        placeholder="Draft content..." 
                        className="min-h-[140px] rounded-3xl border-slate-200 bg-slate-50/50 p-6 font-bold shadow-inner" 
                     />
                  </div>

                  <Button onClick={handleSendDirect} disabled={submitting} className="h-14 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all">
                     <Send className="mr-2 h-4 w-4" />
                     Initialize Send
                  </Button>
               </div>
            </section>

            {/* Gateway Infrastructure */}
            <section className={cardClass}>
               <div className="mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                     <Settings className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Gateway Config</h2>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className={labelClass}>Service Provider</label>
                     <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={config.provider} onChange={e => setConfig({...config, provider: e.target.value})} className={cn(inputClass, "pl-11")} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className={labelClass}>API Authorization</label>
                     <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input type="password" value={config.apiKey} onChange={e => setConfig({...config, apiKey: e.target.value})} className={cn(inputClass, "pl-11")} />
                     </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-2">
                        <label className={labelClass}>Alpha ID</label>
                        <Input value={config.senderId} onChange={e => setConfig({...config, senderId: e.target.value})} className={cn(inputClass, "text-xs px-3")} placeholder="Masking" />
                     </div>
                     <div className="space-y-2">
                        <label className={labelClass}>Numeric ID</label>
                        <Input value={config.nonMaskingNumber} onChange={e => setConfig({...config, nonMaskingNumber: e.target.value})} className={cn(inputClass, "text-xs px-3")} placeholder="Number" />
                     </div>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={submitting} className="h-12 w-full rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg">
                     Commit Infrastructure
                  </Button>
               </div>
            </section>

            {/* Quick Balance Status */}
            <div className="rounded-[32px] bg-slate-50 border border-slate-200 p-8 flex items-center justify-between group hover:bg-white transition-all hover:shadow-xl hover:shadow-slate-200/50">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                     <Activity className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Liquidity</p>
                     <p className="text-xl font-black text-slate-900 tracking-tight">Active_Flow</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-sm font-black text-indigo-600">৳0.50</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg_Per_SMS</p>
               </div>
            </div>
         </aside>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
