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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

type SettingsCategory = 'general' | 'sms' | 'payment' | 'system' | 'email' | 'notifications';

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
    organizationName: '',
    organizationCode: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    timezone: 'Asia/Dhaka',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BDT',
  });

  // SMS Settings
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({
    provider: '',
    apiKey: '',
    apiSecret: '',
    senderId: '',
    maskingEnabled: true,
    nonMaskingEnabled: true,
    defaultMasking: true,
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    gatewayProvider: '',
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
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
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
      // TODO: Replace with actual API call
      // const response = await getSettings();
      // if (response.success && response.data) {
      //   setGeneralSettings(response.data.general || generalSettings);
      //   setSmsSettings(response.data.sms || smsSettings);
      //   setPaymentSettings(response.data.payment || paymentSettings);
      //   setSystemSettings(response.data.system || systemSettings);
      //   setEmailSettings(response.data.email || emailSettings);
      //   setNotificationSettings(response.data.notifications || notificationSettings);
      // }
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
      // TODO: Replace with actual API call
      // await updateSettings({
      //   general: generalSettings,
      //   sms: smsSettings,
      //   payment: paymentSettings,
      //   system: systemSettings,
      //   email: emailSettings,
      //   notifications: notificationSettings,
      // });

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
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
    { id: 'general' as SettingsCategory, label: 'General', icon: Building2 },
    { id: 'sms' as SettingsCategory, label: 'SMS', icon: MessageSquare },
    { id: 'payment' as SettingsCategory, label: 'Payment', icon: CreditCard },
    { id: 'system' as SettingsCategory, label: 'System', icon: Settings },
    { id: 'email' as SettingsCategory, label: 'Email', icon: Mail },
    { id: 'notifications' as SettingsCategory, label: 'Notifications', icon: Bell },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Organization Information</h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name *</Label>
              <Input
                id="orgName"
                value={generalSettings.organizationName}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({ ...prev, organizationName: e.target.value }))
                }
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgCode">Organization Code</Label>
              <Input
                id="orgCode"
                value={generalSettings.organizationCode}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({ ...prev, organizationCode: e.target.value }))
                }
                placeholder="Enter organization code"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={generalSettings.contactEmail}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({ ...prev, contactEmail: e.target.value }))
                }
                placeholder="contact@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                value={generalSettings.contactPhone}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({ ...prev, contactPhone: e.target.value }))
                }
                placeholder="+880 1234 567890"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={generalSettings.address}
              onChange={(e) =>
                setGeneralSettings((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Enter full address"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={generalSettings.website}
              onChange={(e) =>
                setGeneralSettings((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={generalSettings.timezone}
              onValueChange={(v) => setGeneralSettings((prev) => ({ ...prev, timezone: v }))}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={generalSettings.dateFormat}
              onValueChange={(v) => setGeneralSettings((prev) => ({ ...prev, dateFormat: v }))}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={generalSettings.currency}
              onValueChange={(v) => setGeneralSettings((prev) => ({ ...prev, currency: v }))}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BDT">BDT (৳)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSmsSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">SMS Provider Configuration</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smsProvider">Provider</Label>
            <Select
              value={smsSettings.provider}
              onValueChange={(v) => setSmsSettings((prev) => ({ ...prev, provider: v }))}
            >
              <SelectTrigger id="smsProvider">
                <SelectValue placeholder="Select SMS provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                <SelectItem value="custom">Custom API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smsApiKey">API Key</Label>
              <Input
                id="smsApiKey"
                type="password"
                value={smsSettings.apiKey}
                onChange={(e) => setSmsSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smsApiSecret">API Secret</Label>
              <Input
                id="smsApiSecret"
                type="password"
                value={smsSettings.apiSecret}
                onChange={(e) =>
                  setSmsSettings((prev) => ({ ...prev, apiSecret: e.target.value }))
                }
                placeholder="Enter API secret"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smsSenderId">Sender ID</Label>
            <Input
              id="smsSenderId"
              value={smsSettings.senderId}
              onChange={(e) => setSmsSettings((prev) => ({ ...prev, senderId: e.target.value }))}
              placeholder="Enter sender ID"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">SMS Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maskingEnabled">Enable Masking SMS</Label>
              <p className="text-sm text-muted-foreground">Allow sending SMS with masking</p>
            </div>
            <Switch
              id="maskingEnabled"
              checked={smsSettings.maskingEnabled}
              onCheckedChange={(checked) =>
                setSmsSettings((prev) => ({ ...prev, maskingEnabled: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="nonMaskingEnabled">Enable Non-Masking SMS</Label>
              <p className="text-sm text-muted-foreground">Allow sending SMS without masking</p>
            </div>
            <Switch
              id="nonMaskingEnabled"
              checked={smsSettings.nonMaskingEnabled}
              onCheckedChange={(checked) =>
                setSmsSettings((prev) => ({ ...prev, nonMaskingEnabled: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="defaultMasking">Default to Masking</Label>
              <p className="text-sm text-muted-foreground">Use masking by default for SMS</p>
            </div>
            <Switch
              id="defaultMasking"
              checked={smsSettings.defaultMasking}
              onCheckedChange={(checked) =>
                setSmsSettings((prev) => ({ ...prev, defaultMasking: checked }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Gateway Configuration</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gatewayProvider">Gateway Provider</Label>
            <Select
              value={paymentSettings.gatewayProvider}
              onValueChange={(v) =>
                setPaymentSettings((prev) => ({ ...prev, gatewayProvider: v }))
              }
            >
              <SelectTrigger id="gatewayProvider">
                <SelectValue placeholder="Select payment gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                value={paymentSettings.merchantId}
                onChange={(e) =>
                  setPaymentSettings((prev) => ({ ...prev, merchantId: e.target.value }))
                }
                placeholder="Enter merchant ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentApiKey">API Key</Label>
              <Input
                id="paymentApiKey"
                type="password"
                value={paymentSettings.apiKey}
                onChange={(e) =>
                  setPaymentSettings((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="Enter API key"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSecretKey">Secret Key</Label>
            <Input
              id="paymentSecretKey"
              type="password"
              value={paymentSettings.secretKey}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, secretKey: e.target.value }))
              }
              placeholder="Enter secret key"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sandboxMode">Sandbox Mode</Label>
              <p className="text-sm text-muted-foreground">Use test environment for payments</p>
            </div>
            <Switch
              id="sandboxMode"
              checked={paymentSettings.sandboxMode}
              onCheckedChange={(checked) =>
                setPaymentSettings((prev) => ({ ...prev, sandboxMode: checked }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Put the system in maintenance mode</p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={systemSettings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSystemSettings((prev) => ({ ...prev, maintenanceMode: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowRegistration">Allow Registration</Label>
              <p className="text-sm text-muted-foreground">Allow new user registrations</p>
            </div>
            <Switch
              id="allowRegistration"
              checked={systemSettings.allowRegistration}
              onCheckedChange={(checked) =>
                setSystemSettings((prev) => ({ ...prev, allowRegistration: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">Require email verification for new users</p>
            </div>
            <Switch
              id="requireEmailVerification"
              checked={systemSettings.requireEmailVerification}
              onCheckedChange={(checked) =>
                setSystemSettings((prev) => ({ ...prev, requireEmailVerification: checked }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="1440"
                value={systemSettings.sessionTimeout}
                onChange={(e) =>
                  setSystemSettings((prev) => ({
                    ...prev,
                    sessionTimeout: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="3"
                max="10"
                value={systemSettings.maxLoginAttempts}
                onChange={(e) =>
                  setSystemSettings((prev) => ({
                    ...prev,
                    maxLoginAttempts: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">SMTP Configuration</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailProvider">Email Provider</Label>
            <Select
              value={emailSettings.provider}
              onValueChange={(v) => setEmailSettings((prev) => ({ ...prev, provider: v }))}
            >
              <SelectTrigger id="emailProvider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
                <SelectItem value="ses">AWS SES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpHost: e.target.value }))}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={emailSettings.smtpPort}
                onChange={(e) =>
                  setEmailSettings((prev) => ({ ...prev, smtpPort: Number(e.target.value) }))
                }
                placeholder="587"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpUser: e.target.value }))}
                placeholder="Enter SMTP username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) =>
                  setEmailSettings((prev) => ({ ...prev, smtpPassword: e.target.value }))
                }
                placeholder="Enter SMTP password"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="encryption">Encryption</Label>
            <Select
              value={emailSettings.encryption}
              onValueChange={(v) => setEmailSettings((prev) => ({ ...prev, encryption: v }))}
            >
              <SelectTrigger id="encryption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, fromName: e.target.value }))}
                placeholder="Organization Name"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Enable email notifications</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Enable SMS notifications</p>
            </div>
            <Switch
              id="smsNotifications"
              checked={notificationSettings.smsNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, smsNotifications: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Enable push notifications</p>
            </div>
            <Switch
              id="pushNotifications"
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, pushNotifications: checked }))
              }
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Events</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyOnEnrollment">Notify on Enrollment</Label>
              <p className="text-sm text-muted-foreground">Send notification when student enrolls</p>
            </div>
            <Switch
              id="notifyOnEnrollment"
              checked={notificationSettings.notifyOnEnrollment}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, notifyOnEnrollment: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyOnPayment">Notify on Payment</Label>
              <p className="text-sm text-muted-foreground">Send notification when payment is received</p>
            </div>
            <Switch
              id="notifyOnPayment"
              checked={notificationSettings.notifyOnPayment}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, notifyOnPayment: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyOnExam">Notify on Exam</Label>
              <p className="text-sm text-muted-foreground">Send notification for exam schedules</p>
            </div>
            <Switch
              id="notifyOnExam"
              checked={notificationSettings.notifyOnExam}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, notifyOnExam: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyOnAttendance">Notify on Attendance</Label>
              <p className="text-sm text-muted-foreground">Send notification for attendance updates</p>
            </div>
            <Switch
              id="notifyOnAttendance"
              checked={notificationSettings.notifyOnAttendance}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, notifyOnAttendance: checked }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return renderGeneralSettings();
      case 'sms':
        return renderSmsSettings();
      case 'payment':
        return renderPaymentSettings();
      case 'system':
        return renderSystemSettings();
      case 'email':
        return renderEmailSettings();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage system configuration, integrations, and preferences.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSettings} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <section className="glass-panel p-4">
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </nav>
        </section>

        <section className="glass-panel p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-w-3xl">{renderContent()}</div>
          )}
        </section>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
