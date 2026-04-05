'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type GridSlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  topic?: string | null;
  mode?: string;
  isActive?: boolean;
  course?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  teacher?: { id: string; fullName: string } | null;
};

export type PendingSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseName?: string;
  batchName?: string;
  teacherName?: string;
  teacherUserId?: string;
  mode?: string;
};

type RoutineGridProps = {
  slots: GridSlot[];
  pendingSlot?: PendingSlot | null;
  filterTeacherId?: string;
  gridStartHour?: number; // default 6
  gridEndHour?: number;   // default 22
  onCellClick?: (dayOfWeek: number, startTime: string) => void;
  onSlotClick?: (slot: GridSlot) => void;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function RoutineGrid({
  slots,
  pendingSlot,
  filterTeacherId,
  gridStartHour = 6,
  gridEndHour = 22,
  onCellClick,
  onSlotClick,
}: RoutineGridProps) {
  const startMin = gridStartHour * 60;
  const endMin = gridEndHour * 60;
  const totalMins = endMin - startMin;
  // 30-min ticks
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let m = startMin; m < endMin; m += 30) arr.push(m);
    return arr;
  }, [startMin, endMin]);

  const PX_PER_MIN = 2.2;
  const TIME_COL_W = 52;
  const DAY_COL_W = `calc((100% - ${TIME_COL_W}px) / 7)`;

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const m: Record<number, GridSlot[]> = {};
    for (const s of slots) {
      if (!m[s.dayOfWeek]) m[s.dayOfWeek] = [];
      m[s.dayOfWeek].push(s);
    }
    return m;
  }, [slots]);

  // Check if pending slot has a teacher conflict
  const pendingHasConflict = useMemo(() => {
    if (!pendingSlot?.teacherUserId) return false;
    return slots.some(
      (s) =>
        s.dayOfWeek === pendingSlot.dayOfWeek &&
        s.teacher?.id === pendingSlot.teacherUserId &&
        timeToMin(s.startTime) < timeToMin(pendingSlot.endTime) &&
        timeToMin(s.endTime) > timeToMin(pendingSlot.startTime),
    );
  }, [pendingSlot, slots]);

  function renderSlotCard(slot: GridSlot) {
    const top = (timeToMin(slot.startTime) - startMin) * PX_PER_MIN;
    const height = Math.max((timeToMin(slot.endTime) - timeToMin(slot.startTime)) * PX_PER_MIN, 20);
    const isFiltered = filterTeacherId && slot.teacher?.id !== filterTeacherId;
    const isOnline = slot.mode === 'ONLINE';

    return (
      <div
        key={slot.id}
        className={cn(
          'absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold cursor-pointer border transition-all overflow-hidden',
          isOnline
            ? 'bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200'
            : 'bg-teal-100 border-teal-300 text-teal-900 hover:bg-teal-200',
          isFiltered && 'opacity-25',
        )}
        style={{ top, height }}
        onClick={() => onSlotClick?.(slot)}
        title={`${slot.course?.name ?? ''} — ${slot.startTime}–${slot.endTime}`}
      >
        <div className="truncate leading-tight">{slot.batch?.name || slot.course?.name || '—'}</div>
        {height > 28 && slot.teacher && (
          <div className="truncate text-[9px] opacity-70 leading-tight">{slot.teacher.fullName}</div>
        )}
        {height > 42 && (
          <div className="truncate text-[9px] opacity-60 leading-tight">{slot.startTime}–{slot.endTime}</div>
        )}
      </div>
    );
  }

  function renderPendingCard() {
    if (!pendingSlot) return null;
    const top = (timeToMin(pendingSlot.startTime) - startMin) * PX_PER_MIN;
    const height = Math.max(
      (timeToMin(pendingSlot.endTime) - timeToMin(pendingSlot.startTime)) * PX_PER_MIN,
      20,
    );
    return (
      <div
        className={cn(
          'absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold border-2 border-dashed overflow-hidden',
          pendingHasConflict
            ? 'bg-red-100 border-red-400 text-red-900 shadow-md shadow-red-200'
            : 'bg-indigo-100 border-indigo-400 text-indigo-900 animate-pulse',
        )}
        style={{ top, height }}
        title={pendingHasConflict ? 'Teacher conflict!' : 'Preview'}
      >
        <div className="truncate leading-tight">
          {pendingHasConflict ? '⚠ Conflict' : (pendingSlot.batchName || pendingSlot.courseName || 'New Slot')}
        </div>
        {height > 28 && (
          <div className="truncate text-[9px] opacity-70">{pendingSlot.startTime}–{pendingSlot.endTime}</div>
        )}
      </div>
    );
  }

  const gridHeight = totalMins * PX_PER_MIN;

  return (
    <div className="overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Legend */}
      <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-teal-200 border border-teal-400" /> Offline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-blue-200 border border-blue-400" /> Online
        </span>
        {pendingSlot && (
          <span className={cn('flex items-center gap-1.5', pendingHasConflict ? 'text-red-600' : 'text-indigo-600')}>
            <span className={cn('inline-block h-3 w-3 rounded border-2 border-dashed', pendingHasConflict ? 'border-red-500 bg-red-100' : 'border-indigo-500 bg-indigo-100')} />
            {pendingHasConflict ? 'Teacher Conflict!' : 'Preview (new slot)'}
          </span>
        )}
      </div>

      {/* Grid header row */}
      <div className="flex sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
        <div style={{ minWidth: TIME_COL_W, width: TIME_COL_W }} className="shrink-0 border-r border-slate-200 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          Time
        </div>
        {DAY_NAMES.map((day, d) => (
          <div
            key={d}
            className="flex-1 border-r border-slate-200 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-700"
          >
            <span className="hidden md:inline">{DAY_FULL[d]}</span>
            <span className="md:hidden">{day}</span>
          </div>
        ))}
      </div>

      {/* Scrollable grid body */}
      <div className="flex" style={{ height: gridHeight }}>
        {/* Time column */}
        <div style={{ minWidth: TIME_COL_W, width: TIME_COL_W }} className="relative shrink-0 border-r border-slate-200">
          {ticks.map((min) => (
            <div
              key={min}
              className="absolute w-full border-t border-slate-100 text-right pr-1 text-[9px] text-slate-400"
              style={{ top: (min - startMin) * PX_PER_MIN }}
            >
              {minToTime(min)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {Array.from({ length: 7 }, (_, d) => (
          <div key={d} className="relative flex-1 border-r border-slate-100">
            {/* Background tick lines */}
            {ticks.map((min) => (
              <div
                key={min}
                className={cn('absolute w-full border-t', min % 60 === 0 ? 'border-slate-200' : 'border-slate-100')}
                style={{ top: (min - startMin) * PX_PER_MIN }}
              />
            ))}
            {/* Click-to-create cells (every hour) */}
            {ticks
              .filter((m) => m % 60 === 0)
              .map((min) => (
                <div
                  key={min}
                  className="absolute w-full cursor-pointer hover:bg-indigo-50/50 transition-colors"
                  style={{ top: (min - startMin) * PX_PER_MIN, height: 60 * PX_PER_MIN }}
                  onClick={() => onCellClick?.(d, minToTime(min))}
                />
              ))}
            {/* Slot cards */}
            {(slotsByDay[d] || []).map(renderSlotCard)}
            {/* Pending slot preview */}
            {pendingSlot && pendingSlot.dayOfWeek === d && renderPendingCard()}
          </div>
        ))}
      </div>
    </div>
  );
}
