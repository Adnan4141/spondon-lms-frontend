'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTrustedDevices,
  revokeAllTrustedDevices,
  revokeTrustedDevice,
  type TrustedDevice,
} from '@/lib/api/auth';
import { getUsers, type User } from '@/lib/api/users';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { Laptop, Loader2, MonitorSmartphone, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDate(value: string) {
  return new Date(value).toLocaleString('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminSecurityPage() {
  const { user: actor } = useAdminSession();
  const { toast, toasts, removeToast } = useToast();
  const isSuperAdmin = actor?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [targetUser, setTargetUser] = useState<{
    id: string;
    fullName: string;
    mobile: string;
    role: string;
    branchId?: string | null;
  } | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const effectiveUserId = isSuperAdmin ? selectedUserId || actor?.id || '' : actor?.id || '';

  const pageTitle = useMemo(() => {
    if (isSuperAdmin && targetUser && targetUser.id !== actor?.id) {
      return `${targetUser.fullName} — Trusted Devices`;
    }
    return 'Trusted Devices';
  }, [actor?.id, isSuperAdmin, targetUser]);

  const loadDevices = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const response = await getTrustedDevices(
        isSuperAdmin && effectiveUserId !== actor?.id ? effectiveUserId : undefined,
      );
      if (response.success && response.data) {
        setDevices(response.data.devices || []);
        setTargetUser(response.data.user || null);
      } else {
        toast({
          title: 'লোড ব্যর্থ',
          description: response.message || 'Trusted devices লোড করা যায়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'ত্রুটি',
        description: error instanceof Error ? error.message : 'Trusted devices লোড করা যায়নি।',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [actor?.id, effectiveUserId, isSuperAdmin, toast]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        const response = await getUsers({ role: 'BRANCH_ADMIN', limit: 200 });
        if (response.success && Array.isArray(response.data)) {
          setAdminUsers(response.data);
        }
      } catch {
        // non-blocking
      }
    })();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (actor?.id && !selectedUserId) {
      setSelectedUserId(actor.id);
    }
  }, [actor?.id, selectedUserId]);

  useEffect(() => {
    if (effectiveUserId) {
      void loadDevices();
    }
  }, [effectiveUserId, loadDevices]);

  const handleRevoke = async (deviceId: string) => {
    setRevokingId(deviceId);
    try {
      const response = await revokeTrustedDevice(deviceId);
      if (response.success) {
        toast({ title: 'Revoked', description: 'ডিভাইস revoke করা হয়েছে।', variant: 'success' });
        await loadDevices();
      } else {
        toast({
          title: 'ব্যর্থ',
          description: response.message || 'Revoke করা যায়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'ত্রুটি',
        description: error instanceof Error ? error.message : 'Revoke করা যায়নি।',
        variant: 'destructive',
      });
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setConfirmRevokeAll(false);
    setLoading(true);
    try {
      const response = await revokeAllTrustedDevices(
        isSuperAdmin && effectiveUserId !== actor?.id ? effectiveUserId : undefined,
      );
      if (response.success) {
        toast({
          title: 'সব revoke হয়েছে',
          description: 'সব trusted device revoke করা হয়েছে।',
          variant: 'success',
        });
        await loadDevices();
      } else {
        toast({
          title: 'ব্যর্থ',
          description: response.message || 'Revoke করা যায়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'ত্রুটি',
        description: error instanceof Error ? error.message : 'Revoke করা যায়নি।',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeDevices = devices.filter((d) => d.isActive);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#5C2D91]">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            নতুন ডিভাইসে প্রথমবার OTP লাগে। ৩০ দিন লগইন না করলে আবার OTP প্রয়োজন হবে।
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void loadDevices()} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          {activeDevices.length > 0 && (
            <Button variant="destructive" onClick={() => setConfirmRevokeAll(true)} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke All
            </Button>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Admin user
          </label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select admin" />
            </SelectTrigger>
            <SelectContent>
              {actor ? (
                <SelectItem value={actor.id}>
                  {actor.fullName} (Me — Super Admin)
                </SelectItem>
              ) : null}
              {adminUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName} — {u.mobile}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-medium">
            কোনো trusted device নেই। নতুন ডিভাইসে লগইন করলে OTP যাচাইয়ের পর এখানে দেখাবে।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
                    {device.label.toLowerCase().includes('mobile') || device.label.toLowerCase().includes('android') || device.label.toLowerCase().includes('ios') ? (
                      <MonitorSmartphone className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{device.label}</p>
                      <Badge variant={device.isActive ? 'default' : 'secondary'}>
                        {device.isActive ? 'Active' : 'Revoked / Expired'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Trusted: {formatDate(device.trustedAt)} · Last used: {formatDate(device.lastUsedAt)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Expires: {formatDate(device.expiresAt)}
                    </p>
                  </div>
                </div>
                {device.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokingId === device.id}
                    onClick={() => void handleRevoke(device.id)}
                  >
                    {revokingId === device.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Revoke'
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={confirmRevokeAll} onOpenChange={setConfirmRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>সব trusted device revoke করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই ব্যবহারকারীর সব ডিভাইসে পরবর্তী লগইনে OTP লাগবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRevokeAll()}>Revoke All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
