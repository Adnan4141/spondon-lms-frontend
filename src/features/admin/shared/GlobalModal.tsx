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

  const allowInteractionFromPortaledDropdown = (e: { preventDefault: () => void; target: EventTarget | null }) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest?.('[data-slot="popover-content"]') ||
      target?.closest?.('[data-slot="select-content"]')
    ) {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        className={cn(
          'flex max-h-[92vh] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl sm:rounded-[32px]',
          className
        )}
        showCloseButton={true}
        onPointerDownOutside={allowInteractionFromPortaledDropdown}
        onInteractOutside={allowInteractionFromPortaledDropdown}
      >
        <DialogHeader className="relative shrink-0 border-b border-slate-100 bg-slate-50/50 px-4 pb-4 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />
          
          <div className="relative flex items-start gap-3">
            {showBack && (
              <button
                onClick={goBack}
                className="mt-1 h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
              >
                <span className="sr-only">Back</span>
                ←
              </button>
            )}
            <div className="min-w-0">
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">{content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
