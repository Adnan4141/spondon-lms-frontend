'use client';

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
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

type ConfirmVariant = 'danger' | 'warning' | 'info';

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

function ConfirmActionDialog({
  options,
  onResolve,
}: {
  options: ConfirmOptions;
  onResolve: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(true);

  const actionClassName =
    options.variant === 'warning'
      ? 'bg-amber-600 text-white hover:bg-amber-700'
      : options.variant === 'info'
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-rose-600 text-white hover:bg-rose-700';

  const resolveAndClose = (value: boolean) => {
    setOpen(false);
    onResolve(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && resolveAndClose(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>{options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolveAndClose(false)}>
            {options.cancelLabel ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            className={actionClassName}
            onClick={(event) => {
              event.preventDefault();
              resolveAndClose(true);
            }}
          >
            {options.confirmLabel ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
    };

    root.render(<ConfirmActionDialog options={options} onResolve={finish} />);
  });
}