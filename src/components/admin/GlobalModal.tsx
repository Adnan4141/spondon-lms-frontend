'use client';

import { useModalStore } from '@/store/modalStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function GlobalModal() {
  const { isOpen, content, title, description, className, closeModal, goBack, stack } = useModalStore();
  const showBack = stack.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className={cn('max-h-[92vh] gap-0 overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-2xl flex flex-col p-0 rounded-[32px]', className)} showCloseButton={true}>
        <DialogHeader className="relative shrink-0 border-b border-slate-100 bg-slate-50/50 px-8 pb-6 pt-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />
          
          <div className="relative flex items-start gap-3">
            {showBack && (
              <button
                onClick={goBack}
                className="mt-1 h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition"
              >
                <span className="sr-only">Back</span>
                ←
              </button>
            )}
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-base font-medium text-slate-500">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">{content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
