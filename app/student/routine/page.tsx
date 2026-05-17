'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, ChevronRight, Download } from 'lucide-react';
import { getRoutine } from '@/lib/api/student-portal';
import { Button } from '@/components/ui/button';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface RoutineSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  topic?: string;
  room?: string;
  mode?: string;
  course?: { id: string; name: string };
  batch?: { id: string; name: string };
  teacher?: { id: string; fullName: string };
}

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

export default function StudentRoutinePage() {
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!u) {
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(u);
        if (user?.id) {
          const r = await getRoutine(user.id);
          if (r.success && r.data) setSlots(r.data as RoutineSlot[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const today = new Date().getDay();
  const filteredSlots = slots.filter((s) => s.dayOfWeek === selectedDay);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-end">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.print()}
            className="h-11 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-black text-slate-900">
              {DAYS[today]}, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900">Today&apos;s Schedule</h2>
            <div className="flex gap-2">
              {DAYS.slice(1).map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(idx + 1)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    selectedDay === idx + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSlots.length === 0 ? (
            <Card className="rounded-[2.5rem] border-none bg-white p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No Classes Today</h3>
           
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSlots.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
                >
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-2 bg-indigo-600 group-hover:w-3 transition-all" />
                      <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Clock className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                {item.mode === 'ONLINE' ? 'Online' : 'Lecture'}
                              </span>
                              <span className="text-sm font-bold text-slate-400">
                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                              </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {item.topic || item.course?.name || 'Class'}
                            </h3>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1">
                          <div className="flex items-center gap-2 text-slate-600 font-bold">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{item.room || 'TBD'}</span>
                          </div>
                          <p className="text-sm text-slate-400 font-medium">
                            with {item.teacher?.fullName || 'TBD'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
}
