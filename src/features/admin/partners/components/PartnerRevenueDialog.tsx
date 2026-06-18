'use client';

import type { PartnerAdmin } from '@/lib/api/partners';
import type { PartnerRevenueSummary } from '@/lib/api/partners';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type PartnerRevenueDialogProps = {
  open: boolean;
  partner: PartnerAdmin | null;
  summary: PartnerRevenueSummary | null | undefined;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PartnerRevenueDialog({
  open,
  partner,
  summary,
  loading,
  onOpenChange,
}: PartnerRevenueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Revenue Summary — {partner?.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          ) : summary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border p-3">
                  <p className="text-xs text-slate-500">Gross Course & Book Revenue</p>
                  <p className="text-lg font-bold">
                    ৳{Number(summary.totalSales || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-xs text-slate-500">
                    Partner Share ({summary.revenueSharePercent ?? 0}%)
                  </p>
                  <p className="text-lg font-bold text-emerald-700">
                    ৳{Number(summary.partnerShare).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <p className="text-xs text-slate-500">{summary.courseCount} associated course(s)</p>
                <p className="text-xs text-slate-500">{summary.bookCount} associated book(s)</p>
              </div>
              <p className="text-xs text-slate-400">
                Period:{' '}
                {summary.from ? new Date(summary.from).toLocaleDateString() : 'All time'} –{' '}
                {summary.to ? new Date(summary.to).toLocaleDateString() : 'now'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No revenue data.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
