'use client';

import { useState, type FormEvent } from 'react';
import { updateUser, type User } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../users-constants';
import { generateRandomPassword } from '../users-page-utils';

const INPUT_CLS =
  'h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all';

type ResetPasswordDialogProps = {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
};

export function ResetPasswordDialog({ user, onClose, onSuccess }: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const pw = password.trim();
    const cpw = confirmPassword.trim();
    if (!pw) {
      setError('New password is required.');
      return;
    }
    if (pw.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (pw !== cpw) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateUser(user.id, { password: pw });
      if (!res.success) throw new Error(res.message || 'Password reset failed');
      toast({
        title: 'Password updated',
        description: 'User must log in again with the new password.',
        variant: 'success',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black text-slate-900">Reset password</DialogTitle>
        </DialogHeader>
        <p className="text-sm font-medium text-slate-500">
          Set a new password for <strong className="text-slate-800">{user.fullName}</strong> ({user.mobile}).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
              New password
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                className={INPUT_CLS}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-xl font-bold"
                disabled={submitting}
                onClick={() => {
                  const generated = generateRandomPassword();
                  setPassword(generated);
                  setConfirmPassword(generated);
                }}
              >
                Generate
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Confirm password
            </Label>
            <Input
              className={cn(INPUT_CLS, 'mt-1')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={submitting}
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Update password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
