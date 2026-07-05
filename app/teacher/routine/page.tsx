'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Clock, Download, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getRoutineSlots, type RoutineSlot } from '@/lib/api/routine';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

export default function TeacherRoutinePage() {
  const { user, authChecked } = useTeacherSession();
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await getRoutineSlots({ teacherUserId: user.id, isActive: true });
        if (!cancelled && res.success && res.data) setSlots(res.data);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const filteredSlots = useMemo(
    () =>
      slots
        .filter((s) => s.dayOfWeek === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, selectedDay],
  );

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Button onClick={() => window.print()} className="h-11 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-700">
          <Download className="mr-2 h-4 w-4" />
          Print schedule
        </Button>
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-900">
            {DAYS[new Date().getDay()]},{' '}
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAYS.map((day, idx) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(idx)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedDay === idx
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : filteredSlots.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-16 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-xl font-black text-slate-900">No classes scheduled</h3>
            <p className="mt-2 text-sm text-slate-500">Nothing on the schedule for {DAYS[selectedDay]}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSlots.map((item) => (
            <Card key={item.id} className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-1.5 bg-indigo-600" />
                  <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                            {item.mode}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">
                            {formatTime(item.startTime)} – {formatTime(item.endTime)}
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg font-black text-slate-900">
                          {item.topic || item.course?.name || 'Class'}
                        </h3>
                        <p className="text-sm text-slate-500">{item.batch?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {item.branch?.name ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {item.branch.name}
                        </div>
                      ) : null}
                      {item.courseId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/teacher/courses/${item.courseId}`}>
                            Course
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
