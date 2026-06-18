'use client';

import { useState, type FormEvent } from 'react';
import {
  createUser,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
} from '@/lib/api/users';
import type { Branch } from '@/lib/api/branches';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import {
  ALL_STAFF_ROLES,
  BD_MOBILE,
  MIN_PASSWORD_LENGTH,
  ROLE_LABELS,
} from '../users-constants';
import { validatePasswordFields } from '../users-page-utils';

const INPUT_CLS =
  'h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all';

type UserFormProps = {
  user?: User | null;
  branches: Branch[];
  onSuccess: () => void;
  onCancel: () => void;
};

export function UserForm({ user, branches, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const isEdit = !!user;

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string>(user?.role ?? 'TEACHER');
  const [branchId, setBranchId] = useState<string>(user?.branchId ?? '');
  const [status, setStatus] = useState<string>(user?.status ?? 'ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleNeedsBranch = ['BRANCH_ADMIN', 'TEACHER'].includes(role);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!BD_MOBILE.test(mobile)) {
      setError('Enter a valid BD mobile (01XXXXXXXXX).');
      return;
    }
    if (roleNeedsBranch && !branchId) {
      setError('Branch is required for this role.');
      return;
    }

    const pw = password.trim();
    const cpw = confirmPassword.trim();
    const passwordRequired = !isEdit && role !== 'TEACHER';
    const passwordError = validatePasswordFields(pw, cpw, passwordRequired, MIN_PASSWORD_LENGTH);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload: UpdateUserPayload = {
          fullName,
          mobile,
          email: email || undefined,
          role,
          status,
          branchId: branchId || null,
        };
        if (pw) payload.password = pw;
        const res = await updateUser(user!.id, payload);
        if (!res.success) throw new Error(res.message || 'Update failed');
        toast({
          title: pw ? 'Password updated' : 'User updated',
          description: pw ? 'User must log in again with the new password.' : undefined,
          variant: 'success',
        });
      } else {
        const payload: CreateUserPayload = {
          fullName,
          mobile,
          email: email || undefined,
          role,
          branchId: branchId || undefined,
          status,
        };
        if (pw) payload.password = pw;
        const res = await createUser(payload);
        if (!res.success) throw new Error(res.message || 'Create failed');
        if (res.data && 'oneTimePassword' in res.data && res.data.oneTimePassword) {
          toast({
            title: 'User created',
            description: `One-time password: ${res.data.oneTimePassword}`,
            variant: 'success',
          });
        } else {
          toast({ title: 'User created', variant: 'success' });
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Full Name *</Label>
          <Input
            className={cn(INPUT_CLS, 'mt-1')}
            placeholder="e.g. Adnan Hussain"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Mobile *</Label>
          <Input
            className={cn(INPUT_CLS, 'mt-1')}
            placeholder="01XXXXXXXXX"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Email</Label>
          <Input
            className={cn(INPUT_CLS, 'mt-1')}
            type="email"
            placeholder="optional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Role *</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className={cn(INPUT_CLS, 'mt-1')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STAFF_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Branch {roleNeedsBranch ? '*' : '(optional)'}
          </Label>
          <Select value={branchId || 'none'} onValueChange={(v) => setBranchId(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(INPUT_CLS, 'mt-1')}>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None / Unassigned</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={cn(INPUT_CLS, 'mt-1')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            {isEdit
              ? 'New Password (leave blank to keep)'
              : 'Password (blank = auto-generate for teachers)'}
          </Label>
          <Input
            className={cn(INPUT_CLS, 'mt-1')}
            type="password"
            placeholder={isEdit ? 'Change password…' : 'Auto-generate OTP'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Confirm Password
          </Label>
          <Input
            className={cn(INPUT_CLS, 'mt-1')}
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white"
          disabled={submitting}
        >
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {isEdit ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}
