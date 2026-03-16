'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Save,
  RefreshCw,
  Mail,
  MessageSquare,
  CreditCard,
  Globe,
  Bell,
  Shield,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  Smartphone,
  AtSign,
  MapPin,
  Clock as ClockIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { getSmsConfig, upsertSmsConfig, getSmsTemplates, createSmsTemplate } from '@/lib/api/sms';

type SettingsCategory = 'general' | 'sms' | 'payment' | 'system' | 'email' | 'notifications';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

interface GeneralSettings {
  organizationName: string;
  organizationCode: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

interface SmsSettings {
  provider: string;
  apiKey: string;
  apiSecret: string;
  senderId: string;
  maskingEnabled: boolean;
  nonMaskingEnabled: boolean;
  defaultMasking: boolean;
}

interface PaymentSettings {
  gatewayProvider: string;
  merchantId: string;
  apiKey: string;
  secretKey: string;
  sandboxMode: boolean;
  currency: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

interface EmailSettings {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  encryption: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnEnrollment: boolean;
  notifyOnPayment: boolean;
  notifyOnExam: boolean;
  notifyOnAttendance: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function SettingsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    organizationName: 'Spondon LMS',
    organizationCode: 'SLMS-01',
    contactEmail: 'admin@spondon.com',
    contactPhone: '+880 1700 000000',
    address: 'Dhaka, Bangladesh',
    website: 'https://spondon.com',
    timezone: 'Asia/Dhaka',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BDT',
  });

  // SMS Settings
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({
    provider: 'BulkSMSBD',
    apiKey: '',
    apiSecret: '',
    senderId: 'SPONDON',
    maskingEnabled: true,
    nonMaskingEnabled: true,
    defaultMasking: true,
  });

  const [birthdaySettings, setBirthdaySettings] = useState({
    enabled: true,
    template: 'Happy Birthday! Best wishes from Spondon Academy.'
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    gatewayProvider: 'sslcommerz',
    merchantId: '',
    apiKey: '',
    secretKey: '',
    sandboxMode: true,
    currency: 'BDT',
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@spondon.com',
    fromName: 'Spondon LMS',
    encryption: 'tls',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    notifyOnEnrollment: true,
    notifyOnPayment: true,
    notifyOnExam: true,
    notifyOnAttendance: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [smsRes, tplRes] = await Promise.all([
        getSmsConfig(),
        getSmsTemplates()
      ]);

      if (smsRes.success && smsRes.data) {
        setSmsSettings(prev => ({
          ...prev,
          provider: smsRes.data.provider,
          apiKey: smsRes.data.apiKey,
          senderId: smsRes.data.senderId || '',
          nonMaskingNumber: smsRes.data.nonMaskingNumber || '',
        } as any));
      }

      if (tplRes.success && tplRes.data) {
        const bdayTpl = tplRes.data.find((t: any) => t.key === 'BIRTHDAY_WISH');
        if (bdayTpl) {
          setBirthdaySettings({
            enabled: true,
            template: bdayTpl.body
          });
        }
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (activeCategory === 'sms') {
        await upsertSmsConfig({
          provider: smsSettings.provider,
          apiKey: smsSettings.apiKey,
          senderId: smsSettings.senderId,
          nonMaskingNumber: (smsSettings as any).nonMaskingNumber,
        });

        await createSmsTemplate({
          key: 'BIRTHDAY_WISH',
          body: birthdaySettings.template,
          isMasking: smsSettings.defaultMasking
        });
      } else {
        // Handle other categories
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: 'Success',
        description: 'Settings saved',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { id: 'general' as SettingsCategory, label: 'General', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'sms' as SettingsCategory, label: 'SMS', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'payment' as SettingsCategory, label: 'Payments', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'email' as SettingsCategory, label: 'Email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'notifications' as SettingsCategory, label: 'Notifications', icon: Bell, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'system' as SettingsCategory, label: 'System', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <ShieldCheck className="h-4 w-4 text-indigo-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Organization</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className={sectionLabel}>Organization Name</Label>
            <Input
              className={inputClass}
              value={generalSettings.organizationName}
              onChange={(e) => setGeneralSettings(p => ({ ...p, organizationName: e.target.value }))}
              placeholder="e.g., Spondon Education"
            />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Org Code</Label>
            <Input
              className={inputClass}
              value={generalSettings.organizationCode}
              onChange={(e) => setGeneralSettings(p => ({ ...p, organizationCode: e.target.value }))}
              placeholder="e.g., SE-01"
            />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Email</Label>
            <div className="relative">
               <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input
                 type="email"
                 className={cn(inputClass, "pl-11")}
                 value={generalSettings.contactEmail}
                 onChange={(e) => setGeneralSettings(p => ({ ...p, contactEmail: e.target.value }))}
               />
            </div>
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Phone</Label>
            <div className="relative">
               <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input
                 className={cn(inputClass, "pl-11")}
                 value={generalSettings.contactPhone}
                 onChange={(e) => setGeneralSettings(p => ({ ...p, contactPhone: e.target.value }))}
               />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label className={sectionLabel}>Address</Label>
            <div className="relative">
               <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
               <Textarea
                 className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-4 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                 value={generalSettings.address}
                 onChange={(e) => setGeneralSettings(p => ({ ...p, address: e.target.value }))}
               />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <Globe className="h-4 w-4 text-emerald-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Region</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className={sectionLabel}>Timezone</Label>
            <Select value={generalSettings.timezone} onValueChange={(v) => setGeneralSettings(p => ({ ...p, timezone: v }))}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="Asia/Dhaka" className="font-bold py-3">Asia/Dhaka (GMT+6)</SelectItem>
                <SelectItem value="UTC" className="font-bold py-3">UTC (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Date Format</Label>
            <Select value={generalSettings.dateFormat} onValueChange={(v) => setGeneralSettings(p => ({ ...p, dateFormat: v }))}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="DD/MM/YYYY" className="font-bold py-3">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD" className="font-bold py-3">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Currency</Label>
            <Select value={generalSettings.currency} onValueChange={(v) => setGeneralSettings(p => ({ ...p, currency: v }))}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="BDT" className="font-bold py-3">BDT (Tk)</SelectItem>
                <SelectItem value="USD" className="font-bold py-3">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSmsSettings = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <Smartphone className="h-4 w-4 text-emerald-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">SMS</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label className={sectionLabel}>Provider</Label>
            <Select value={smsSettings.provider} onValueChange={(v) => setSmsSettings(p => ({ ...p, provider: v }))}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="BulkSMSBD" className="font-bold py-3 text-indigo-600">BulkSMSBD</SelectItem>
                <SelectItem value="twilio" className="font-bold py-3 text-blue-600">Twilio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>API Key</Label>
            <Input className={inputClass} type="password" value={smsSettings.apiKey} onChange={(e) => setSmsSettings(p => ({ ...p, apiKey: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Sender ID</Label>
            <Input className={inputClass} value={smsSettings.senderId} onChange={(e) => setSmsSettings(p => ({ ...p, senderId: e.target.value }))} placeholder="e.g. SPONDON" />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Non-masking Number</Label>
            <Input className={inputClass} value={(smsSettings as any).nonMaskingNumber} onChange={(e) => setSmsSettings(p => ({ ...p, nonMaskingNumber: e.target.value } as any))} placeholder="e.g. 88096..." />
          </div>
        </div>
      </section>

      <section className="space-y-6 border-t border-slate-100 pt-10">
        <div className="flex items-center gap-2">
           <Zap className="h-4 w-4 text-amber-500" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Automation</h3>
        </div>
        
        <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="space-y-1">
            <p className="text-base font-black text-slate-800">Birthday SMS</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Send SMS on birthdays</p>
          </div>
          <Switch
            checked={birthdaySettings.enabled}
            onCheckedChange={(checked) => setBirthdaySettings(p => ({ ...p, enabled: checked }))}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        {birthdaySettings.enabled && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className={sectionLabel}>Birthday Message Template</Label>
            <Textarea
              className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 px-4 py-4 text-base font-bold text-slate-900 shadow-inner"
              value={birthdaySettings.template}
              onChange={(e) => setBirthdaySettings(p => ({ ...p, template: e.target.value }))}
              placeholder="Happy Birthday! ..."
            />
            <p className="text-[9px] font-bold text-slate-400 uppercase px-2 italic">Variables: [fullName] will be replaced by student name</p>
          </div>
        )}
      </section>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <CreditCard className="h-4 w-4 text-amber-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Financial Bridge</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label className={sectionLabel}>Gateway Architecture</Label>
            <Select value={paymentSettings.gatewayProvider} onValueChange={(v) => setPaymentSettings(p => ({ ...p, gatewayProvider: v }))}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="sslcommerz" className="font-bold py-3 text-blue-600">SSLCommerz Protocol</SelectItem>
                <SelectItem value="bkash" className="font-bold py-3 text-rose-600">bKash Ecosystem</SelectItem>
                <SelectItem value="stripe" className="font-bold py-3 text-indigo-600">Stripe Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Merchant Reference</Label>
            <Input className={inputClass} value={paymentSettings.merchantId} onChange={(e) => setPaymentSettings(p => ({ ...p, merchantId: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Production API Key</Label>
            <Input className={inputClass} type="password" value={paymentSettings.apiKey} onChange={(e) => setPaymentSettings(p => ({ ...p, apiKey: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-900 text-white shadow-xl">
            <div className="space-y-1">
              <p className="text-base font-black tracking-tight">Sandbox Environment</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Test transactions authorized</p>
            </div>
            <Switch
              checked={paymentSettings.sandboxMode}
              onCheckedChange={(checked) => setPaymentSettings(p => ({ ...p, sandboxMode: checked }))}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>
      </section>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <Mail className="h-4 w-4 text-blue-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">SMTP Infrastructure</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className={sectionLabel}>Host Node</Label>
            <Input className={inputClass} value={emailSettings.smtpHost} onChange={(e) => setEmailSettings(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Network Port</Label>
            <Input className={inputClass} type="number" value={emailSettings.smtpPort} onChange={(e) => setEmailSettings(p => ({ ...p, smtpPort: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Identity Username</Label>
            <Input className={inputClass} value={emailSettings.smtpUser} onChange={(e) => setEmailSettings(p => ({ ...p, smtpUser: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className={sectionLabel}>Access Password</Label>
            <Input className={inputClass} type="password" value={emailSettings.smtpPassword} onChange={(e) => setEmailSettings(p => ({ ...p, smtpPassword: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label className={sectionLabel}>Encryption Protocol</Label>
            <Select value={emailSettings.encryption} onValueChange={(v) => setEmailSettings(p => ({ ...p, encryption: v }))}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="tls" className="font-bold py-3">TLS (Standard)</SelectItem>
                <SelectItem value="ssl" className="font-bold py-3">SSL (Legacy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
           <Bell className="h-4 w-4 text-rose-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Dispatch Channels</h3>
        </div>
        {[
          { id: 'emailNotifications', label: 'Electronic Mail Protocol', icon: Mail, color: 'text-blue-500' },
          { id: 'smsNotifications', label: 'Cellular SMS Protocol', icon: Smartphone, color: 'text-emerald-500' },
          { id: 'pushNotifications', label: 'Direct Push Interface', icon: Zap, color: 'text-amber-500' },
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
               <div className={cn("h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center", item.color)}>
                  <item.icon className="h-5 w-5" />
               </div>
               <p className="text-base font-black text-slate-800">{item.label}</p>
            </div>
            <Switch
              checked={(notificationSettings as any)[item.id]}
              onCheckedChange={(checked) => setNotificationSettings(p => ({ ...p, [item.id]: checked }))}
              className="data-[state=checked]:bg-rose-500"
            />
          </div>
        ))}
      </section>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <Database className="h-4 w-4 text-slate-600" />
           <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Core Engine Configuration</h3>
        </div>
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-6 rounded-[32px] bg-rose-600 text-white shadow-xl">
            <div className="space-y-1">
              <p className="text-base font-black">Maintenance Protocol</p>
              <p className="text-[10px] font-bold text-rose-200 uppercase tracking-tighter">Authorized personnel access only</p>
            </div>
            <Switch
              checked={systemSettings.maintenanceMode}
              onCheckedChange={(checked) => setSystemSettings(p => ({ ...p, maintenanceMode: checked }))}
              className="data-[state=checked]:bg-white data-[state=checked]:[&>span]:bg-rose-600"
            />
          </div>
          <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="space-y-1">
              <p className="text-base font-black text-slate-800">Open Registration</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Permit new user autonomous onboarding</p>
            </div>
            <Switch
              checked={systemSettings.allowRegistration}
              onCheckedChange={(checked) => setSystemSettings(p => ({ ...p, allowRegistration: checked }))}
            />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
           <div className="space-y-2">
              <Label className={sectionLabel}>Session Expiry (Min)</Label>
              <Input className={inputClass} type="number" value={systemSettings.sessionTimeout} onChange={(e) => setSystemSettings(p => ({ ...p, sessionTimeout: Number(e.target.value) }))} />
           </div>
           <div className="space-y-2">
              <Label className={sectionLabel}>Lockout Threshold</Label>
              <Input className={inputClass} type="number" value={systemSettings.maxLoginAttempts} onChange={(e) => setSystemSettings(p => ({ ...p, maxLoginAttempts: Number(e.target.value) }))} />
           </div>
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'general': return renderGeneralSettings();
      case 'sms': return renderSmsSettings();
      case 'payment': return renderPaymentSettings();
      case 'email': return renderEmailSettings();
      case 'notifications': return renderNotificationSettings();
      case 'system': return renderSystemSettings();
      default: return null;
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 px-2">
             <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                <Lock className="h-5 w-5" />
             </div>
             <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Global Settings</h2>
                <p className="mt-1 text-base font-bold text-indigo-500 leading-none">Administrative Protocol</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" 
              onClick={loadSettings} 
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button 
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95" 
              onClick={handleSave} 
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Processing...' : 'Commit Changes'}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
           <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
             <nav className="space-y-2">
               {categories.map((cat) => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.id)}
                   className={cn(
                     "group w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-black uppercase tracking-widest transition-all",
                     activeCategory === cat.id
                       ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                       : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                   )}
                 >
                   <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition-colors", 
                      activeCategory === cat.id ? "bg-white/10" : cat.bg,
                      activeCategory === cat.id ? "text-white" : cat.color
                   )}>
                      <cat.icon className="h-4 w-4" />
                   </div>
                   <span>{cat.label}</span>
                 </button>
               ))}
             </nav>
           </div>
           
           <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-6 text-white shadow-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-indigo-400 mb-4">
                 <Shield className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black uppercase tracking-widest">Protocol Audit</h4>
              <p className="mt-2 text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">System changes are logged and synchronized across the institutional cluster.</p>
           </div>
        </aside>

        <main className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Parameters...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">{renderContent()}</div>
          )}
        </main>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
