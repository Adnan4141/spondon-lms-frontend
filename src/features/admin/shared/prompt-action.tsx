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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type PromptOptions = {
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Render a multi-line textarea instead of a single-line input. */
  multiline?: boolean;
  /** Require a non-empty value (after trimming). Defaults to true. */
  required?: boolean;
  /** Minimum length (after trimming) before the value can be submitted. */
  minLength?: number;
};

function PromptActionDialog({
  options,
  onResolve,
}: {
  options: PromptOptions;
  onResolve: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState(options.defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);

  const required = options.required ?? true;
  const minLength = options.minLength ?? 0;

  const resolveAndClose = (result: string | null) => {
    setOpen(false);
    onResolve(result);
  };

  const submit = () => {
    const trimmed = value.trim();
    if (required && trimmed === '') {
      setError('This field is required.');
      return;
    }
    if (minLength > 0 && trimmed.length < minLength) {
      setError(`Please enter at least ${minLength} characters.`);
      return;
    }
    resolveAndClose(trimmed === '' ? null : trimmed);
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && resolveAndClose(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {options.multiline ? (
          <Textarea
            autoFocus
            rows={4}
            value={value}
            placeholder={options.placeholder}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
          />
        ) : (
          <Input
            autoFocus
            value={value}
            placeholder={options.placeholder}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolveAndClose(null)}>
            {options.cancelLabel ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {options.confirmLabel ?? 'Save'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Imperative, promise-based text prompt that renders an in-app modal instead of
 * the native `window.prompt`. Resolves to the trimmed string, or `null` if the
 * user cancels.
 */
export function promptAction(options: PromptOptions): Promise<string | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
    };
    root.render(<PromptActionDialog options={options} onResolve={finish} />);
  });
}
