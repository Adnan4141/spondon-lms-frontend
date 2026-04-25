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
  updateSmsBalance,
  getProviderBalance,
  transferSmsBalance,
  getSmsLogs,
  SmsConfig, 
  SmsTemplate 
} from '@/lib/api/sms';
import { getPrograms } from '@/lib/api/programs';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { getSmsPricing, initiateSmsPurchase, getSmsTransactions } from '@/lib/api/sms-purchase';
import { MonthPicker } from '@/components/ui/month-picker';
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
import { ConfirmationModal } from '@/features/admin/shared';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toast';
import { SmsLogDetails } from '@/features/admin/sms';
import { cardClass, inputClass, labelClass } from '@/features/admin/sms';

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
  const [smsTransactions, setSmsTransactions] = useState<any[]>([]);
  const [smsPricing, setSmsPricing] = useState<{ pricePerSms: number; minPurchase: number }>({ pricePerSms: 0.5, minPurchase: 100 });
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(100);
  const [purchaseScope, setPurchaseScope] = useState<'ORG' | 'BRANCH'>('ORG');
  const [purchaseBranchId, setPurchaseBranchId] = useState('');
  
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
    isMasking: false,
    branchId: '',
    scope: 'ORG'
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

  const [providerBalance, setProviderBalance] = useState<any>(null);
  const [newOrgBalance, setNewOrgBalance] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, templatesRes, campaignsRes, progRes, branchRes, balanceRes, logsRes, providerRes] = await Promise.all([
        getSmsConfig(),
        getSmsTemplates(),
        getCampaigns(),
        getPrograms(),
        getBranches(),
        getSmsBalance(),
        getSmsLogs(1, 20),
        getProviderBalance()
      ]);

      if (configRes.success && configRes.data) setConfig(configRes.data);
      if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data);
      if (campaignsRes.success && campaignsRes.data) setCampaigns(campaignsRes.data);
      if (progRes.success && progRes.data) setPrograms(progRes.data);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
      if (balanceRes.success && balanceRes.data) {
        setBalances(balanceRes.data);
        const org = balanceRes.data.find((b: any) => b.scope === 'ORG');
        if (org) setNewOrgBalance(org.balanceCount);
      }
      if (logsRes.success && logsRes.data) setSmsLogs(logsRes.data);
      if (providerRes.success) setProviderBalance(providerRes.data);

      const [pricingRes, txRes] = await Promise.all([
        getSmsPricing(),
        getSmsTransactions({ page: 1, limit: 10 })
      ]);
      if (pricingRes.success && pricingRes.data) setSmsPricing(pricingRes.data);
      if (txRes.success && txRes.data) setSmsTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSms = async () => {
    if (purchaseQuantity < smsPricing.minPurchase) {
      toast({ title: 'Error', description: `Minimum purchase is ${smsPricing.minPurchase} SMS`, variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await initiateSmsPurchase({
        scope: purchaseScope,
        branchId: purchaseScope === 'BRANCH' ? purchaseBranchId : undefined,
        quantity: purchaseQuantity,
        cusName: 'Admin',
        cusEmail: 'admin@spondon.com',
        cusPhone: '01700000000',
      });
      if (res.success && res.data?.GatewayPageURL) {
        window.location.href = res.data.GatewayPageURL;
      } else {
        toast({ title: 'Error', description: (res as any).message || 'Failed to initiate purchase', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrgBalance = async () => {
    try {
      setSubmitting(true);
      const res = await updateSmsBalance({
        scope: 'ORG',
        balanceCount: newOrgBalance
      });
      if (res.success) {
        toast({ title: 'Balance Updated', description: 'Organization SMS balance has been updated', variant: 'success' });
        loadData();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
        toast({ title: 'Saved', description: 'SMS settings updated', variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDirect = async () => {
    if (!directSend.to || !directSend.message) {
      toast({ title: 'Missing info', description: 'Number and message are required', variant: 'destructive' });
      return;
    }

    if (directSend.scope === 'BRANCH' && !directSend.branchId) {
      toast({ title: 'Select branch', description: 'Choose a branch for branch scope', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await sendDirectSms(
        directSend.to, 
        directSend.message, 
        directSend.isMasking,
        directSend.scope === 'BRANCH' ? directSend.branchId : undefined,
        directSend.scope
      );
      if (res.success) {
        toast({ title: 'Sent', description: 'SMS sent', variant: 'success' });
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
      toast({ title: 'Missing info', description: 'Select a branch and amount', variant: 'destructive' });
      return;
    }

    if (transfer.count > orgBalance) {
      toast({ title: 'Not enough balance', description: 'Amount exceeds org balance', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await transferSmsBalance(transfer.branchId, transfer.count);

      if (res.success) {
        toast({ title: 'Transferred', description: `Moved ${transfer.count} credits`, variant: 'success' });
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
      toast({ title: 'Error', description: 'Message is required', variant: 'destructive' });
      return;
    }

    openModal({
      title: 'Send campaign',
      description: `Send to about ${previewCount || 0} people.`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Send"
          description="Send this SMS campaign?"
          variant="info"
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
                  toast({ title: 'Sent', description: 'Campaign sent', variant: 'success' });
                  loadData();
                  setNewCampaign({ ...newCampaign, message: '' });
                }
              }
            } catch (err: any) {
              toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
      title: 'SMS log',
      description: `Campaign ID: ${log.id.slice(0, 12)}`,
      className: 'sm:max-w-3xl',
      content: <SmsLogDetails log={log} />,
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
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">SMS Center</h1>
          <p className="text-base font-bold text-indigo-500/80 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Manage SMS, balance, and campaigns
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
                  {providerBalance && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                      <Globe className="h-3 w-3" />
                      <span>Provider Balance: {providerBalance.balance || providerBalance.data?.balance || '0.00'}</span>
                    </div>
                  )}
               </div>

               <div className="pt-8 border-t border-slate-100 space-y-5">
                  <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Assign Primary Balance</p>
                     <div className="flex gap-2">
                        <Input 
                           type="number" 
                           placeholder="Set Total Credits" 
                           value={newOrgBalance || ''} 
                           onChange={e => setNewOrgBalance(parseInt(e.target.value) || 0)}
                           className={inputClass}
                        />
                        <Button 
                           onClick={handleUpdateOrgBalance} 
                           disabled={submitting} 
                           className="h-12 w-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white shadow-lg shrink-0"
                        >
                           <CheckCircle2 className="h-5 w-5" />
                        </Button>
                     </div>
                  </div>

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
                           <MonthPicker value={newCampaign.targetMonth} onChange={v => setNewCampaign({...newCampaign, targetMonth: v})} placeholder="Select month" />
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
                              <p className="text-[10px] font-bold text-slate-400 tracking-widest">PAYLOAD_COST: Tk {log.cost || 0}</p>
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

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                        <label className={labelClass}>Billing Scope</label>
                        <Select value={directSend.scope} onValueChange={v => setDirectSend({...directSend, scope: v})}>
                           <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl shadow-xl">
                              <SelectItem value="ORG" className="font-bold py-3 text-xs">Organization</SelectItem>
                              <SelectItem value="BRANCH" className="font-bold py-3 text-xs">Branch</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className={labelClass}>Target Branch</label>
                        <Select value={directSend.branchId} onValueChange={v => setDirectSend({...directSend, branchId: v})} disabled={directSend.scope === 'ORG'}>
                           <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold">
                              <SelectValue placeholder="Branch" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl shadow-xl">
                              {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3 text-xs">{b.name}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>
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

            {/* SMS Purchase via SSL E-commerce */}
            <section className={cardClass}>
               <div className="mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <CreditCard className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Purchase SMS (SSL)</h2>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className={labelClass}>Quantity (min {smsPricing.minPurchase})</label>
                     <Input type="number" value={purchaseQuantity || ''} onChange={e => setPurchaseQuantity(parseInt(e.target.value) || 0)} placeholder="e.g. 500" className={inputClass} min={smsPricing.minPurchase} />
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total</p>
                     <p className="text-2xl font-black text-indigo-600">৳ {(purchaseQuantity * smsPricing.pricePerSms).toFixed(2)}</p>
                     <p className="text-[9px] font-bold text-slate-500 mt-1">৳{smsPricing.pricePerSms} per SMS</p>
                  </div>
                  <div className="space-y-2">
                     <label className={labelClass}>Credit to</label>
                     <Select value={purchaseScope} onValueChange={(v: 'ORG' | 'BRANCH') => setPurchaseScope(v)}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-xl">
                           <SelectItem value="ORG" className="font-bold py-3">Organization</SelectItem>
                           <SelectItem value="BRANCH" className="font-bold py-3">Branch</SelectItem>
                        </SelectContent>
                     </Select>
                     {purchaseScope === 'BRANCH' && (
                        <Select value={purchaseBranchId} onValueChange={setPurchaseBranchId}>
                           <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold mt-2">
                              <SelectValue placeholder="Select branch" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl shadow-xl">
                              {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">{b.name}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     )}
                  </div>
                  <Button onClick={handlePurchaseSms} disabled={submitting || purchaseQuantity < smsPricing.minPurchase} className="h-14 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-xl">
                     <CreditCard className="mr-2 h-4 w-4" />
                     Pay via SSL Gateway
                  </Button>
                  {smsTransactions.length > 0 && (
                     <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Recent</p>
                        {smsTransactions.slice(0, 3).map((t: any) => (
                           <div key={t.id} className="flex justify-between text-xs font-bold py-1">
                              <span>{t.quantity} SMS</span>
                              <Badge variant="outline" className={cn("text-[9px]", t.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{t.status}</Badge>
                           </div>
                        ))}
                     </div>
                  )}
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
                  <p className="text-sm font-black text-indigo-600">Tk 0.50</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg_Per_SMS</p>
               </div>
            </div>
         </aside>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
