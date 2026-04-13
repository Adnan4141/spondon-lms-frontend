'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { createAssociatedCourse } from '@/lib/api/courses';
import { useToast } from '@/hooks/use-toast';
import { Link2, Save, X } from 'lucide-react';

interface CourseAssociationFormProps {
  fromCourseId: string;
  courses: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const associationTypes = [
  { value: 'RECOMMENDED', label: 'Recommended' },
  { value: 'NEXT', label: 'Next Course' },
  { value: 'PREREQUISITE', label: 'Prerequisite' },
  { value: 'RELATED', label: 'Related' },
];

export function CourseAssociationForm({ fromCourseId, courses, onSuccess, onCancel }: CourseAssociationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    toCourseId: '',
    type: 'RECOMMENDED',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.toCourseId) return;

    try {
      setLoading(true);
      const res = await createAssociatedCourse({
        fromCourseId,
        toCourseId: formData.toCourseId,
        type: formData.type
      });

      if (res.success) {
        toast({ title: 'Added', description: 'Related course added successfully', variant: 'success' });
        onSuccess();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filter out the current course from options
  const availableCourses = courses.filter(c => c.id !== fromCourseId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-indigo-50/30 p-6 rounded-[24px] border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Select Course</Label>
          <Select value={formData.toCourseId} onValueChange={(v) => setFormData({...formData, toCourseId: v})}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold">
              <SelectValue placeholder="Choose a course" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-xl">
              {availableCourses.map(c => (
                <SelectItem key={c.id} value={c.id} className="font-bold py-3">
                  {c.name} <span className="text-slate-400 font-mono text-[10px] ml-2">[{c.slug}]</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Relation Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-xl">
              {associationTypes.map(t => <SelectItem key={t.value} value={t.value} className="font-bold py-3">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={loading || !formData.toCourseId}
          className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all"
        >
          <Link2 className="mr-2 h-4 w-4" />
          {loading ? 'Adding...' : 'Add Related Course'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="h-12 px-6 rounded-2xl border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
