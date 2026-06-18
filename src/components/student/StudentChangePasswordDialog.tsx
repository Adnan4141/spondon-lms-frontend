'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { changeMyPassword } from '@/lib/api/users';
import { cn } from '@/lib/utils';

const inputClass =
  'h-11 rounded-xl border-slate-200 bg-slate-50/80 px-3 pr-10 text-sm font-semibold text-slate-900';

export function StudentChangePasswordDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Use at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Enter the same new password twice.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await changeMyPassword({ currentPassword, newPassword });
      if (res.success) {
        toast({ title: 'Password updated', variant: 'success' });
        resetForm();
        setOpen(false);
      } else {
        toast({
          title: 'Update failed',
          description: (res as { message?: string }).message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-2 rounded-2xl border-white/40 bg-white/10 font-bold text-white hover:bg-white/20 hover:text-white"
        >
          <KeyRound className="h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl border-slate-200 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900">Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500">Current password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                className={cn(inputClass)}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setShowCurrent((x) => !x)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500">New password (min. 6 characters)</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(inputClass)}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setShowNew((x) => !x)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500">Confirm new password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(inputClass)}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setShowConfirm((x) => !x)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-bold"
              disabled={submitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
