'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { createCourseContent, updateCourseContent } from '@/lib/api/courses';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Save, X } from 'lucide-react';

interface CourseResourceFormProps {
  courseId: string;
  resource?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const contentTypes = [
  { value: 'SYLLABUS', label: 'Course Syllabus' },
  { value: 'LEAFLET', label: 'Marketing Leaflet' },
  { value: 'SCHEDULE', label: 'Course Schedule' },
  { value: 'SAMPLE', label: 'Free Sample' },
  { value: 'NOTE', label: 'Lecture Note' },
  { value: 'VIDEO', label: 'Video Content' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'OTHER', label: 'Other Resource' },
];

export function CourseResourceForm({ courseId, resource, onSuccess, onCancel }: CourseResourceFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: resource?.type || 'NOTE',
    title: resource?.title || '',
    textBody: resource?.textBody || '',
    isFree: resource?.isFree || false,
    sortOrder: resource?.sortOrder || 0,
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      setLoading(true);
      const data = new FormData();
      data.append('courseId', courseId);
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('textBody', formData.textBody);
      data.append('isFree', String(formData.isFree));
      data.append('sortOrder', String(formData.sortOrder));
      if (file) data.append('file', file);

      const res = resource 
        ? await updateCourseContent(resource.id, data)
        : await createCourseContent(data);

      if (res.success) {
        toast({ title: 'Success', description: `Resource ${resource ? 'updated' : 'added'} successfully`, variant: 'success' });
        onSuccess();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50/50 p-6 rounded-[24px] border border-slate-200 animate-in fade-in zoom-in duration-300">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resource Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-xl">
              {contentTypes.map(t => <SelectItem key={t.value} value={t.value} className="font-bold py-3">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resource Title</Label>
          <Input 
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g. Week 1 Lecture Slides"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Attachment (File/Media)</Label>
          <div className="relative group">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <div className="h-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center px-4 gap-3 group-hover:border-indigo-400 transition-all">
              <FileUp className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
              <span className="text-sm font-bold text-slate-500 truncate">
                {file ? file.name : resource?.fileUrl ? 'Change existing attachment' : 'Upload file or video'}
              </span>
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Content / Description (Optional)</Label>
          <Textarea 
            className="min-h-[100px] rounded-[20px] border-slate-200 bg-white p-4 font-bold"
            value={formData.textBody}
            onChange={e => setFormData({...formData, textBody: e.target.value})}
            placeholder="Add detailed information or embed links..."
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="space-y-0.5">
            <p className="text-sm font-black text-slate-800">Public Access</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Visible to non-enrolled students</p>
          </div>
          <Switch checked={formData.isFree} onCheckedChange={v => setFormData({...formData, isFree: v})} />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sort Priority</Label>
          <Input 
            type="number" 
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold" 
            value={formData.sortOrder} 
            onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Synchronizing...' : resource ? 'Update Resource' : 'Publish Resource'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="h-12 w-12 rounded-2xl border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
