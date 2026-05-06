'use client';

import type { Account } from '@/lib/api/accounting';
import type { Branch } from '@/lib/api/branches';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AccountForm } from '../AccountForm';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount: Account | null;
  branches: Branch[];
  onSaved: () => void | Promise<void>;
};

export function AccountEditDialog({
  open,
  onOpenChange,
  editingAccount,
  branches,
  onSaved,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // DialogContent defaults include sm:max-w-lg; keep compact account form width explicitly.
          'sm:max-w-lg',
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-black">{editingAccount ? `Edit - ${editingAccount.name}` : 'New Account'}</DialogTitle>
        </DialogHeader>
        <AccountForm
          account={editingAccount}
          branches={branches}
          onSuccess={async () => {
            onOpenChange(false);
            await onSaved();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
