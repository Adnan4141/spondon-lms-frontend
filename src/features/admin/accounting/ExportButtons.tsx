'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ExportFormat } from '@/lib/export';

export function ExportButtons({
  onExport,
  disabled,
}: {
  onExport: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={() => void onExport('csv')}>
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={() => void onExport('xlsx')}>
        <Download className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}
