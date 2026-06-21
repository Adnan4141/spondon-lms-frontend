import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ExportFormat } from '@/lib/export';
import { cn } from '@/lib/utils';

export function ExportButtons({
  onExport,
  disabled,
  className,
}: {
  onExport: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-center" disabled={disabled} onClick={() => void onExport('csv')}>
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-center" disabled={disabled} onClick={() => void onExport('xlsx')}>
        <Download className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}
