'use client';

import type { Program } from '@/types/course';
import type { Batch } from '@/lib/api/batches';
import { ClipboardList } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AttendanceMonthSelect } from './AttendanceMonthSelect';
import type { AttendanceSheetController } from '../hooks/useAttendanceSheet';

type Props = Pick<
  AttendanceSheetController,
  | 'programs'
  | 'loadingPrograms'
  | 'isMonthlyProgram'
  | 'selectedMonth'
  | 'setSelectedMonth'
  | 'monthOptions'
  | 'courseOptions'
  | 'branchOptions'
  | 'batches'
  | 'loadingBatches'
  | 'selectedProgramId'
  | 'selectedCourseId'
  | 'selectedBranchId'
  | 'selectedBatchId'
  | 'onProgramChange'
  | 'onCourseChange'
  | 'onBranchChange'
  | 'onBatchChange'
>;

export function AttendanceFilterCard({
  programs,
  loadingPrograms,
  isMonthlyProgram,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  courseOptions,
  branchOptions,
  batches,
  loadingBatches,
  selectedProgramId,
  selectedCourseId,
  selectedBranchId,
  selectedBatchId,
  onProgramChange,
  onCourseChange,
  onBranchChange,
  onBatchChange,
}: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-base">Step 1 — Select Program, Course & Batch</CardTitle>
        </div>
        <CardDescription>Choose the batch you want to manage attendance for.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Program</Label>
            <Select value={selectedProgramId} onValueChange={onProgramChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={loadingPrograms ? 'Loading…' : 'Select program'} />
              </SelectTrigger>
              <SelectContent>
                {(programs as Program[]).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.paymentCircle === 'MONTHLY' ? ' · Monthly' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isMonthlyProgram ? (
            <AttendanceMonthSelect
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions}
              hint="Courses and attendance are filtered to this month."
            />
          ) : null}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Course</Label>
            <SearchableSelect
              value={selectedCourseId}
              disabled={!selectedProgramId}
              onValueChange={onCourseChange}
              placeholder="Select course"
              searchPlaceholder="Search course…"
              emptyMessage={selectedProgramId ? 'No course found.' : 'Select a program first.'}
              triggerClassName="h-9 rounded-md border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-background"
              options={courseOptions}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Branch (optional)</Label>
            <SearchableSelect
              value={selectedBranchId}
              disabled={!selectedCourseId}
              onValueChange={onBranchChange}
              placeholder="All branches"
              searchPlaceholder="Search branch…"
              emptyMessage={selectedCourseId ? 'No branch found.' : 'Select a course first.'}
              triggerClassName="h-9 rounded-md border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-background"
              options={branchOptions}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Batch</Label>
            <Select value={selectedBatchId} disabled={!selectedCourseId} onValueChange={onBatchChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={loadingBatches ? 'Loading…' : 'Select batch'} />
              </SelectTrigger>
              <SelectContent>
                {(batches as Batch[]).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
