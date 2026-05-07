import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Check, Loader2 } from 'lucide-react';
import { BookFormCompletionRing } from './BookFormCompletionRing';

export function BookFormFooter({
  formCompletion,
  submitting,
  mode,
  onClose,
  onSubmit,
}: {
  formCompletion: number;
  submitting: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogFooter className="shrink-0 border-t border-border bg-linear-to-r from-emerald-50 via-white to-rose-50 px-4 py-4 dark:from-emerald-950/20 dark:via-slate-950 dark:to-rose-950/20 sm:px-6">
      <div className="flex w-full flex-col gap-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 via-sky-500 to-rose-500 transition-[width] duration-500 ease-out"
            style={{ width: `${formCompletion}%` }}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BookFormCompletionRing value={formCompletion} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Readiness {formCompletion}%</p>
              <p className="text-[11px] text-muted-foreground">
                {formCompletion >= 100
                  ? 'Ready to publish.'
                  : 'Scroll through each block — name, SKU, category, story, and cover are the essentials.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" className="rounded-lg text-muted-foreground" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="min-w-36 rounded-lg bg-linear-to-r from-sky-800 to-blue-800 font-semibold text-white shadow-sm hover:from-sky-500 hover:to-blue-500"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4 opacity-90" />}
              {mode === 'create' ? 'Create book' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </DialogFooter>
  );
}
