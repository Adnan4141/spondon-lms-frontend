'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { useModalStore } from '@/store/modalStore';

interface ConfirmationModalProps {
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Discard',
  variant = 'danger',
}: ConfirmationModalProps) {
  const { closeModal } = useModalStore();

  const handleConfirm = async () => {
    await onConfirm();
    closeModal();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="h-7 w-7 text-rose-600" />,
          bg: 'bg-rose-50',
          border: 'border-rose-100',
          button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-7 w-7 text-amber-600" />,
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
        };
      default:
        return {
          icon: <AlertCircle className="h-7 w-7 text-indigo-600" />,
          bg: 'bg-indigo-50',
          border: 'border-indigo-100',
          button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="flex flex-col p-0 overflow-hidden rounded-[40px] bg-white border-none">
      <div className="px-10 pt-10 pb-6 relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
        <div className="relative flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${styles.bg} shadow-sm border ${styles.border}`}>
            {styles.icon}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
            <p className="text-base font-medium text-slate-500 mt-1">Strategic Finalization Required</p>
          </div>
        </div>
      </div>

      <div className="px-10 py-8">
        <p className="text-lg font-bold text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        <Button 
          variant="ghost" 
          className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all w-full sm:w-auto" 
          onClick={closeModal}
        >
          {cancelLabel}
        </Button>
        <Button 
          className={`flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto ${styles.button}`}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
