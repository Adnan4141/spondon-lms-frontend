'use client';

import { Button } from '@/components/ui/button';
import { SmsSendWorkspace } from '@/features/admin/sms/components/SmsSendWorkspace';
import type { SmsRecipient } from '@/lib/api/sms';
import type { BranchOption } from './types';

export type ResultSmsFocus = {
  batchId: string;
  branchId: string;
  label: string;
  recipients: SmsRecipient[];
};

type ResultSmsDrawerProps = {
  examId: string;
  branches: BranchOption[];
  smsFocus: ResultSmsFocus;
  onClose: () => void;
  onSuccess: () => void;
};

export function ResultSmsDrawer({ examId, branches, smsFocus, onClose, onSuccess }: ResultSmsDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        aria-label="Close result SMS workspace"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-6xl overflow-y-auto bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-blue-600">Focused SMS Workspace</p>
            <h2 className="text-lg font-bold text-slate-950">{smsFocus.label}</h2>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 sm:p-6">
          <SmsSendWorkspace
            branches={branches}
            rates={{ maskingRate: 0.5, nonMaskingRate: 0.35 }}
            focused={{
              method: 'students',
              locked: true,
              contextLabel: 'Result SMS',
              templateKey: 'RESULT',
              defaultMessage: '{name}, {exam}: {grade}. Check portal.',
              context: 'exam_result',
              type: 'RESULT',
              source: 'SYSTEM',
              scope: 'BRANCH',
              branchId: smsFocus.branchId,
              allowSchedule: true,
              dedupeScope: { examId, resultBatchId: smsFocus.batchId },
              metadata: { examId, resultBatchId: smsFocus.batchId },
              recipients: smsFocus.recipients,
            }}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
}
