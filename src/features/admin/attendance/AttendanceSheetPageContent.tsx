'use client';

import { Toaster } from '@/components/ui/toast';
import { AttendancePageHeader } from './components/AttendancePageHeader';
import { AttendanceStepIndicator } from './components/AttendanceStepIndicator';
import { AttendanceFilterCard } from './components/AttendanceFilterCard';
import { AttendanceDateRangeCard } from './components/AttendanceDateRangeCard';
import { AttendanceMatrixCard } from './components/AttendanceMatrixCard';
import { AttendanceExportCard } from './components/AttendanceExportCard';
import { useAttendanceSheet } from './hooks/useAttendanceSheet';

export function AttendanceSheetPageContent() {
  const ctrl = useAttendanceSheet();

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Toaster />
      <AttendancePageHeader />
      <AttendanceStepIndicator currentStep={ctrl.currentStep} />
      <AttendanceFilterCard {...ctrl} />
      {ctrl.batchLoaded ? (
        <>
          <AttendanceDateRangeCard {...ctrl} />
          <AttendanceMatrixCard {...ctrl} />
          <AttendanceExportCard {...ctrl} />
        </>
      ) : null}
    </div>
  );
}
