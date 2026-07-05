'use client';

import { AlertTriangle, Calendar, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMonthLabel } from '../attendance-utils';
import type { AttendanceSheetController } from '../hooks/useAttendanceSheet';

type Props = Pick<
  AttendanceSheetController,
  | 'isMonthlyProgram'
  | 'selectedMonth'
  | 'startDate'
  | 'endDate'
  | 'setStartDate'
  | 'setEndDate'
  | 'sheetLoading'
  | 'sessions'
  | 'students'
  | 'selectedCourseId'
  | 'selectedBatchId'
  | 'publishing'
  | 'loadSheet'
  | 'publishFromRoutine'
  | 'applyMonthPreset'
  | 'clearDateRange'
>;

export function AttendanceDateRangeCard({
  isMonthlyProgram,
  selectedMonth,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  sheetLoading,
  sessions,
  students,
  selectedCourseId,
  selectedBatchId,
  publishing,
  loadSheet,
  publishFromRoutine,
  applyMonthPreset,
  clearDateRange,
}: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-base">
            {isMonthlyProgram ? 'Step 2 — Session Range' : 'Step 2 — Select Date Range'}
          </CardTitle>
        </div>
        <CardDescription>
          {isMonthlyProgram
            ? 'Month is selected in Step 1. Reload sessions or generate from routine if none exist yet.'
            : 'Filter attendance columns by date range. Sessions matching routine days will be shown.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          {isMonthlyProgram ? (
            <>
              {selectedMonth ? (
                <Badge variant="outline" className="h-8 border-emerald-200 bg-emerald-50 px-3 text-emerald-800">
                  {formatMonthLabel(selectedMonth)} · {startDate} → {endDate}
                </Badge>
              ) : null}
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void loadSheet()}
                disabled={sheetLoading}
              >
                {sheetLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => applyMonthPreset(0)}>
                  This month
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => applyMonthPreset(1)}>
                  Next month
                </Button>
                {(startDate || endDate) && (
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={clearDateRange}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Start date</span>
                  <Input
                    type="date"
                    className="h-8 w-36 text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">End date</span>
                  <Input
                    type="date"
                    className="h-8 w-36 text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => void loadSheet()}
                  disabled={sheetLoading}
                >
                  {sheetLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </>
          )}
        </div>

        {!sheetLoading && selectedCourseId && selectedBatchId && (
          <div className="flex items-center gap-3">
            {sessions.length > 0 ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {students.length} student
                {students.length !== 1 ? 's' : ''}
              </Badge>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>No sessions found{startDate ? ' in this range' : ''}.</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-amber-300 text-xs text-amber-800 hover:bg-amber-100"
                  disabled={publishing || !startDate || !endDate}
                  onClick={() => void publishFromRoutine()}
                >
                  {publishing ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate from routine
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
