'use client';

import Link from 'next/link';
import { BarChart3, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AttendancePageHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Attendance Sheet</h1>
        <p className="text-sm text-muted-foreground">Mark, export, and import attendance by date range</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/admin/attendance-sheet/import">
          <Button variant="outline" size="sm">
            <Upload className="mr-1.5 h-4 w-4" /> Import
          </Button>
        </Link>
        <Link href="/admin/attendance-sheet/summary">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-1.5 h-4 w-4" /> Summary
          </Button>
        </Link>
      </div>
    </div>
  );
}
