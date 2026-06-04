'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MeritRow } from './types';

export function MeritListTab({ meritRows, canExport = true }: { meritRows: MeritRow[]; canExport?: boolean }) {
  return (
    <Card id="merit-print" className="border-slate-200 shadow-sm scroll-mt-24">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Merit list (combined)</CardTitle>
          <CardDescription>Online attempts and approved offline results · printable.</CardDescription>
        </div>
        {canExport ? (
          <Button type="button" variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {meritRows.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No merit rows yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meritRows.map((row, index) => (
                <TableRow key={String(row.studentUserId ?? index)}>
                  <TableCell>{String(row.rank ?? index + 1)}</TableCell>
                  <TableCell>{String(row.fullName ?? '—')}</TableCell>
                  <TableCell className="text-slate-600">{String(row.rollNo ?? '—')}</TableCell>
                  <TableCell className="text-right">
                    {String(row.marks ?? '—')} / {String(row.totalMarks ?? '—')}
                  </TableCell>
                  <TableCell className="text-right">{String(row.percentage ?? '—')}</TableCell>
                  <TableCell className="text-slate-600">{String(row.source ?? '—')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
