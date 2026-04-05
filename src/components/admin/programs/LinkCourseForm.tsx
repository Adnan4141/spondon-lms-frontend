'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getCourses, updateCourse } from '@/lib/api/courses';
import { useToast } from '@/hooks/use-toast';
import { Link2, X } from 'lucide-react';

interface LinkCourseFormProps {
  programId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LinkCourseForm({ programId, onSuccess, onCancel }: LinkCourseFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await getCourses({});
      if (res.success && res.data) {
        // Filter out courses that are already in this program
        setCourses(res.data.filter((c: any) => c.programId !== programId));
      }
    };
    fetchCourses();
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      // We update the course to have this programId
      const res = await updateCourse(selectedCourseId, { programId } as any);

      if (res.success) {
        toast({ title: 'Course Embedded', description: 'Course successfully linked to this program', variant: 'success' });
        onSuccess();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-indigo-50/30 p-6 rounded-[24px] border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Embed Existing Course</Label>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold">
            <SelectValue placeholder="Select course to embed" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-xl max-h-[300px]">
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id} className="font-bold py-3">
                {c.name} <span className="text-slate-400 font-mono text-[10px] ml-2">[{c.code}]</span>
              </SelectItem>
            ))}
            {courses.length === 0 && <div className="p-4 text-center text-xs font-bold text-slate-400">No external courses found</div>}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={loading || !selectedCourseId}
          className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all"
        >
          <Link2 className="mr-2 h-4 w-4 text-white" />
          {loading ? 'Embedding...' : 'Embed Course'}
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
