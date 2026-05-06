import { Card, CardContent } from '@/components/ui/card';
import { CircleAlert } from 'lucide-react';

export function BookFormAttentionNotice({ sectionTitle }: { sectionTitle: string }) {
  return (
    <Card className="rounded-xl border-amber-200/70 bg-linear-to-r from-amber-50 to-rose-50 shadow-none dark:border-amber-900/50 dark:from-amber-950/20 dark:to-rose-950/20">
      <CardContent className="flex items-start gap-3 px-5 py-4">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
          <CircleAlert className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{sectionTitle} needs attention</p>
          <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
            Complete the required fields in this section before saving the book record.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
