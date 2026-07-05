'use client';

import { Check, Loader2, RefreshCw, Save, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { cellKey, statusColor, statusLabel } from '../attendance-utils';
import type { AttendanceStatus } from '@/lib/api/attendance';
import type { AttendanceSheetController } from '../hooks/useAttendanceSheet';

type Props = Pick<
  AttendanceSheetController,
  | 'sheetLoading'
  | 'sessions'
  | 'students'
  | 'cells'
  | 'summaryMap'
  | 'dirty'
  | 'focusSessionId'
  | 'setFocusSessionId'
  | 'saving'
  | 'focusCounts'
  | 'cycleCell'
  | 'isCellEligible'
  | 'markAllPresent'
  | 'save'
>;

export function AttendanceMatrixCard({
  sheetLoading,
  sessions,
  students,
  cells,
  summaryMap,
  dirty,
  focusSessionId,
  setFocusSessionId,
  saving,
  focusCounts,
  cycleCell,
  isCellEligible,
  markAllPresent,
  save,
}: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base">Attendance Matrix</CardTitle>
            {dirty && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {focusSessionId && (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={markAllPresent}>
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Mark all present
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
              disabled={!dirty || saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Click a date header to focus that session. Click a cell to cycle status (P → A → L → …).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sheetLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            Loading attendance…
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            No class sessions. Generate sessions from the routine to start marking attendance.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/80 hover:bg-muted/80">
                    <TableHead className="sticky left-0 z-10 min-w-[200px] bg-muted/95 font-semibold">
                      Student
                    </TableHead>
                    <TableHead className="min-w-[56px] text-center text-xs font-semibold">%</TableHead>
                    {sessions.map((s) => (
                      <TableHead
                        key={s.id}
                        className={cn(
                          'min-w-[80px] cursor-pointer select-none text-center text-xs font-semibold transition-colors',
                          s.id === focusSessionId ? 'bg-emerald-100 text-emerald-900' : 'hover:bg-muted',
                        )}
                        onClick={() => setFocusSessionId(s.id === focusSessionId ? null : s.id)}
                      >
                        <div className="whitespace-nowrap">
                          {new Date(s.sessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        {s.topic ? (
                          <div className="mt-0.5 line-clamp-1 text-[10px] font-normal text-muted-foreground">
                            {s.topic}
                          </div>
                        ) : null}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((st) => {
                    const summary = summaryMap[st.id];
                    const pct = summary?.attendancePercent;
                    return (
                      <TableRow key={st.id} className="hover:bg-muted/30">
                        <TableCell className="sticky left-0 z-10 bg-background font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                          {st.fullName}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-center font-mono text-xs font-semibold',
                            pct == null
                              ? 'text-muted-foreground'
                              : pct >= 75
                                ? 'text-emerald-700'
                                : pct >= 50
                                  ? 'text-amber-700'
                                  : 'text-rose-700',
                          )}
                        >
                          {pct != null ? `${pct}%` : '—'}
                        </TableCell>
                        {sessions.map((s) => {
                          const k = cellKey(s.id, st.id);
                          const val = cells[k] ?? '';
                          const eligible = isCellEligible(s.id, st.id);
                          return (
                            <TableCell
                              key={k}
                              className={cn(
                                'p-1 text-center transition-colors',
                                eligible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                                s.id === focusSessionId && eligible && 'bg-emerald-50/60',
                              )}
                              onClick={() => eligible && cycleCell(s.id, st.id)}
                            >
                              <span
                                className={cn(
                                  'inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold transition-all',
                                  eligible
                                    ? statusColor(val as AttendanceStatus | '')
                                    : 'border-border/50 bg-muted/30 text-muted-foreground/50',
                                )}
                              >
                                {eligible ? statusLabel(val as AttendanceStatus | '') : '·'}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {focusSessionId ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Focused session:</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-emerald-800">
                  P {focusCounts.p}
                </span>
                <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-rose-800">
                  A {focusCounts.a}
                </span>
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-amber-800">
                  L {focusCounts.l}
                </span>
                <span className="text-muted-foreground">Unmarked {focusCounts.unset}</span>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
