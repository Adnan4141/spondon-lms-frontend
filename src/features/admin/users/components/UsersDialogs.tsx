'use client';

import type { Branch } from '@/lib/api/branches';
import type { User } from '@/lib/api/users';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { UserDetailView } from './UserDetailView';
import { UserForm } from './UserForm';

type UsersDialogsProps = {
  branches: Branch[];
  formOpen: boolean;
  editingUser: User | null;
  detailUser: User | null;
  blockTarget: User | null;
  deleteTarget: User | null;
  resetTarget: User | null;
  actionLoading: boolean;
  onFormOpenChange: (open: boolean) => void;
  onFormSuccess: () => void;
  onFormCancel: () => void;
  onDetailOpenChange: (open: boolean) => void;
  onBlockOpenChange: (open: boolean) => void;
  onDeleteOpenChange: (open: boolean) => void;
  onResetClose: () => void;
  onResetSuccess: () => void;
  onBlockConfirm: () => void;
  onDeleteConfirm: () => void;
};

export function UsersDialogs({
  branches,
  formOpen,
  editingUser,
  detailUser,
  blockTarget,
  deleteTarget,
  resetTarget,
  actionLoading,
  onFormOpenChange,
  onFormSuccess,
  onFormCancel,
  onDetailOpenChange,
  onBlockOpenChange,
  onDeleteOpenChange,
  onResetClose,
  onResetSuccess,
  onBlockConfirm,
  onDeleteConfirm,
}: UsersDialogsProps) {
  return (
    <>
      <Dialog open={formOpen} onOpenChange={onFormOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">
              {editingUser ? `Edit — ${editingUser.fullName}` : 'Add new user'}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            branches={branches}
            onSuccess={onFormSuccess}
            onCancel={onFormCancel}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailUser} onOpenChange={onDetailOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">User Details</DialogTitle>
          </DialogHeader>
          {detailUser ? <UserDetailView user={detailUser} /> : null}
        </DialogContent>
      </Dialog>

      {resetTarget ? (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={onResetClose}
          onSuccess={onResetSuccess}
        />
      ) : null}

      <AlertDialog open={!!blockTarget} onOpenChange={onBlockOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.status === 'ACTIVE' ? 'Block this user?' : 'Activate this user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget?.status === 'ACTIVE'
                ? `${blockTarget?.fullName} will lose access to the admin panel immediately.`
                : `${blockTarget?.fullName} will regain access to the admin panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onBlockConfirm();
              }}
              disabled={actionLoading}
              className={
                blockTarget?.status === 'ACTIVE'
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }
            >
              {actionLoading ? 'Updating…' : blockTarget?.status === 'ACTIVE' ? 'Block' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.fullName}</strong> and all their data.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDeleteConfirm();
              }}
              disabled={actionLoading}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {actionLoading ? 'Deleting…' : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
