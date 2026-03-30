'use client';

import { useState, useEffect } from 'react';
import {
  createUser,
  updateUser,
  type User as TeacherUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/api/users';
import type { Branch } from '@/lib/api/branches';
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
import { Building2, User as UserIcon, Phone, Mail, Lock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

const BD_MOBILE = /^01[3-9]\d{8}$/;

type TeacherFormProps = {
  branches: Branch[];
  teacher?: TeacherUser | null;
  /** When set, branch is fixed (e.g. branch admin). */
  lockedBranchId?: string | null;
  onSuccess: () => Promise<void>;
};

export function TeacherForm({ branches, teacher, lockedBranchId, onSuccess }: TeacherFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const isEdit = !!teacher;

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.fullName);
      setMobile(teacher.mobile);
      setEmail(teacher.email || '');
      setBranchId(teacher.branchId || '');
      setStatus(teacher.status || 'ACTIVE');
      setPassword('');
      setPhotoUrl(teacher.profileImage || '');
    } else {
      setFullName('');
      setMobile('');
      setEmail('');
      setPassword('');
      setBranchId(lockedBranchId || '');
      setStatus('ACTIVE');
      setPhotoUrl('');
    }
  }, [teacher, lockedBranchId]);

  const effectiveBranchId = lockedBranchId || branchId || undefined;

  const handleSubmit = async () => {
    setError(null);
    const name = fullName.trim();
    const mob = mobile.trim();
    const em = email.trim();

    if (!name) {
      setError('Full name is required');
      return;
    }
    if (!BD_MOBILE.test(mob)) {
      setError('Use an 11-digit Bangladesh mobile (e.g. 01712345678)');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters, or leave blank to auto-generate');
      return;
    }

    try {
      setSubmitting(true);

      if (isEdit && teacher) {
        const payload: UpdateUserPayload = {
          fullName: name,
          mobile: mob,
          email: em || undefined,
          status,
          profileImage: photoUrl || null,
        };
        if (lockedBranchId) {
          payload.branchId = lockedBranchId;
        } else {
          payload.branchId = branchId ? branchId : null;
        }
        if (password.trim()) payload.password = password.trim();

        const res = await updateUser(teacher.id, payload);
        if (res.success) {
          await onSuccess();
          toast({ title: 'Saved', description: 'Teacher updated.', variant: 'success' });
          closeModal();
        } else {
          setError(res.message || 'Update failed');
        }
      } else {
        const payload: CreateUserPayload = {
          fullName: name,
          mobile: mob,
          email: em || undefined,
          role: 'TEACHER',
          status: 'ACTIVE',
          profileImage: photoUrl || undefined,
        };
        if (password.trim()) payload.password = password.trim();
        if (effectiveBranchId) payload.branchId = effectiveBranchId;

        const res = await createUser(payload);
        if (res.success && res.data) {
          await onSuccess();
          const otp = (res.data as { oneTimePassword?: string }).oneTimePassword;
          toast({
            title: 'Teacher created',
            description: otp
              ? `Share this one-time password with the teacher: ${otp}`
              : 'Teacher account is ready.',
            variant: 'success',
          });
          closeModal();
        } else {
          setError(res.message || 'Could not create teacher');
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Profile</h3>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Full name</label>
              <Input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Teacher name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>Mobile (login)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="01712345678"
                    disabled={isEdit}
                  />
                </div>
                {isEdit && (
                  <p className="text-[10px] font-bold text-slate-400 px-1">Mobile cannot be changed here.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Profile photo (URL)</label>
                <Input
                  className={inputClass}
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://…/photo.jpg"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Branch</h3>
            </div>
            {lockedBranchId ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                {branches.find((b) => b.id === lockedBranchId)?.name || 'Your branch'}
              </p>
            ) : (
              <div className="space-y-2">
                <label className={sectionLabel}>Home branch</label>
                <Select value={branchId || 'none'} onValueChange={(v) => setBranchId(v === 'none' ? '' : v)}>
                  <SelectTrigger className={cn(inputClass, 'h-12')}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Not assigned</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Password</h3>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>{isEdit ? 'New password (optional)' : 'Password (optional)'}</label>
              <Input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Leave blank to auto-generate'}
              />
              {!isEdit && (
                <p className="text-[10px] font-bold text-slate-500 px-1 leading-relaxed">
                  If empty, the system creates a one-time password and shows it after save.
                </p>
              )}
            </div>
          </section>

          {isEdit && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Access</h3>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className={cn(inputClass, 'h-12')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl font-bold"
            onClick={closeModal}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-12 rounded-2xl text-white bg-slate-900 font-bold hover:bg-indigo-600"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create teacher'}
          </Button>
        </div>
      </div>
    </div>
  );
}
