import { MessageSquare } from 'lucide-react';

export function PaymentSmsNotice({ enrolled }: { enrolled?: boolean }) {
  return (
    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-left">
      <div className="flex items-start gap-2">
        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="space-y-1 text-sm text-slate-600">
          <p>A payment confirmation SMS will be sent to your registered mobile number.</p>
          {enrolled ? (
            <p>An enrollment notice SMS will also be sent based on your SMS alert settings.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
