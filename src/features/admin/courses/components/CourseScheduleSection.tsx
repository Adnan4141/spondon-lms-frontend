'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { createCourseSchedule, deleteCourseSchedule } from '@/lib/api/course-schedules';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
}

interface CourseScheduleSectionProps {
  courseId: string;
  schedules: ScheduleItem[];
  onRefresh: () => void;
}

export function CourseScheduleSection({ courseId, schedules, onRefresh }: CourseScheduleSectionProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await createCourseSchedule({
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        sortOrder: schedules.length,
      });
      if (res.success) {
        toast({ title: 'Added', description: 'Schedule item added' });
        setTitle('');
        setDescription('');
        setStartDate(undefined);
        setEndDate(undefined);
        setShowForm(false);
        onRefresh();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmAction({
      title: 'Remove schedule item?',
      description: 'This schedule item will be removed from the course.',
      confirmLabel: 'Remove item',
      variant: 'danger',
    }))) return;
    const res = await deleteCourseSchedule(id);
    if (res.success) {
      toast({ title: 'Removed', description: 'Schedule item deleted' });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Schedule Item
        </Button>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/50 p-6 space-y-4">
          <Input
            placeholder="Title (e.g. Week 1: Introduction)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 rounded-2xl font-bold"
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-2xl font-medium min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start font-normal h-12 rounded-2xl", !startDate && "text-slate-400")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">End</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start font-normal h-12 rounded-2xl", !endDate && "text-slate-400")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={submitting} className="h-12 rounded-2xl bg-indigo-600">
              Save
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="h-12 rounded-2xl">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {schedules.map((s) => (
          <div key={s.id} className="flex items-start justify-between p-6 rounded-[24px] border border-slate-100 bg-white hover:border-indigo-100 transition-all group">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-800">{s.title}</h4>
                {s.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
                {(s.startDate || s.endDate) && (
                  <p className="text-xs font-bold text-slate-400 mt-2">
                    {s.startDate && format(new Date(s.startDate), 'MMM d, yyyy')}
                    {s.startDate && s.endDate && ' — '}
                    {s.endDate && format(new Date(s.endDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(s.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {schedules.length === 0 && !showForm && (
          <div className="py-16 text-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
            <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No schedule items yet</p>
            <p className="text-xs text-slate-400 mt-1">Add class routine or timeline milestones</p>
          </div>
        )}
      </div>
    </div>
  );
}
