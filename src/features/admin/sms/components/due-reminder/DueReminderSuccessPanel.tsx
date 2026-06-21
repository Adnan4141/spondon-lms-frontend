'use client';

import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DueReminderSuccessPanel({
  queuedCount,
  estimatedCost,
  scheduledAt,
  onDone,
}: {
  queuedCount: number;
  estimatedCost: number;
  scheduledAt?: string;
  onDone: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
      <h3 className="mt-4 text-xl font-bold text-emerald-950">
        {queuedCount.toLocaleString()} due reminder{queuedCount === 1 ? '' : 's'} queued
      </h3>
      <p className="mt-2 text-sm text-emerald-800">
        {scheduledAt
          ? <>Scheduled for <strong>{new Date(scheduledAt).toLocaleString()}</strong>.</>
          : <>Estimated cost <strong>৳{estimatedCost.toFixed(2)}</strong>.</>}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" asChild className="gap-2 bg-white">
          <Link href="/admin/sms">
            View SMS Log
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </div>
    </section>
  );
}
