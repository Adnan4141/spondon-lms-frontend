'use client';

import { useState, useEffect } from 'react';
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
  SelectValue,
} from '@/components/ui/select';
import { createCourseContent, updateCourseContent } from '@/lib/api/courses';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Save, X, Link2, Upload } from 'lucide-react';
import { normalizeYoutubeWatchUrl, parseYoutubeVideoId } from '@/lib/youtube';
import { isLocalUploadPath, isValidHttpUrl } from '@/lib/attachment-url';

type CourseResourceLike = {
  id?: string;
  type?: string;
  title?: string;
  textBody?: string;
  isFree?: boolean;
  sortOrder?: number;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string | null;
  topicSortOrder?: number | null;
  durationMinutes?: number | null;
  fileUrl?: string | null;
};

interface CourseResourceFormProps {
  courseId: string;
  resource?: CourseResourceLike;
  /** Curriculum subject (e.g. Physics) */
  defaultSubjectTitle?: string;
  /** Chapter under subject */
  defaultChapterTitle?: string;
  /** Optional segment label for sidebar ordering */
  defaultTopicTitle?: string;
  defaultTopicSortOrder?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const contentTypes = [
  { value: 'SYLLABUS', label: 'Syllabus' },
  { value: 'LEAFLET', label: 'Leaflet' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'SAMPLE', label: 'Free Sample' },
  { value: 'NOTE', label: 'Note' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PDF', label: 'PDF' },
  { value: 'OTHER', label: 'Other' },
];

export function CourseResourceForm({
  courseId,
  resource,
  defaultSubjectTitle,
  defaultChapterTitle,
  defaultTopicTitle,
  defaultTopicSortOrder,
  onSuccess,
  onCancel,
}: CourseResourceFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: resource?.type || 'NOTE',
    title: resource?.title || '',
    textBody: resource?.textBody || '',
    isFree: resource?.isFree || false,
    sortOrder: resource?.sortOrder || 0,
    subjectTitle: resource?.subjectTitle || defaultSubjectTitle || '',
    chapterTitle: resource?.chapterTitle || defaultChapterTitle || '',
    topicTitle: resource?.topicTitle || defaultTopicTitle || '',
    topicSortOrder: resource?.topicSortOrder ?? defaultTopicSortOrder ?? '',
    durationMinutes: resource?.durationMinutes ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [attachmentMode, setAttachmentMode] = useState<'upload' | 'link'>(() => {
    const u = resource?.fileUrl;
    return u && !isLocalUploadPath(u) && isValidHttpUrl(u) ? 'link' : 'upload';
  });
  const [linkUrl, setLinkUrl] = useState(() => {
    const u = resource?.fileUrl;
    return u && !isLocalUploadPath(u) && isValidHttpUrl(u) ? u : '';
  });

  useEffect(() => {
    const u = resource?.fileUrl;
    if (u && !isLocalUploadPath(u) && isValidHttpUrl(u)) {
      setAttachmentMode('link');
      setLinkUrl(u);
    } else {
      setAttachmentMode('upload');
      setLinkUrl('');
    }
    setFile(null);
  }, [resource?.id, resource?.fileUrl]);

  const isVideoType = formData.type === 'VIDEO';
  const fileAccept = isVideoType
    ? 'video/*'
    : 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (attachmentMode === 'link') {
      const persistedExternal =
        resource?.fileUrl && !isLocalUploadPath(resource.fileUrl) && isValidHttpUrl(resource.fileUrl)
          ? resource.fileUrl
          : '';
      const url = (linkUrl.trim() || persistedExternal).trim();
      if (!url) {
        toast({
          title: 'Link required',
          description: 'Enter a URL or switch to file upload.',
          variant: 'destructive',
        });
        return;
      }
      if (isVideoType) {
        if (!parseYoutubeVideoId(url)) {
          toast({
            title: 'Invalid YouTube link',
            description: 'Use a watch, embed, Shorts, or youtu.be URL (unlisted works; fully private videos cannot be embedded).',
            variant: 'destructive',
          });
          return;
        }
      } else if (!isValidHttpUrl(url)) {
        toast({
          title: 'Invalid link',
          description: 'Use a full https:// or http:// URL (e.g. Google Drive, hosted PDF).',
          variant: 'destructive',
        });
        return;
      }
    } else if (isVideoType) {
      const hasHostedFile = !!resource?.fileUrl && isLocalUploadPath(resource.fileUrl);
      if (!file && !hasHostedFile) {
        toast({
          title: 'Video file required',
          description: 'Upload a video file, or switch to YouTube link.',
          variant: 'destructive',
        });
        return;
      }
      if (!file && resource?.fileUrl && !isLocalUploadPath(resource.fileUrl)) {
        toast({
          title: 'Upload a file or use YouTube',
          description: 'This lesson uses a YouTube link. Switch to “YouTube / link” to keep it, or upload a file to replace it.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('courseId', courseId);
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('textBody', formData.textBody);
      data.append('isFree', String(formData.isFree));
      data.append('sortOrder', String(formData.sortOrder));
      data.append('subjectTitle', formData.subjectTitle || '');
      data.append('chapterTitle', formData.chapterTitle || '');
      data.append('topicTitle', formData.topicTitle);
      data.append('topicSortOrder', String(formData.topicSortOrder));
      data.append('durationMinutes', String(formData.durationMinutes));

      if (attachmentMode === 'link') {
        const persistedExternal =
          resource?.fileUrl && !isLocalUploadPath(resource.fileUrl) && isValidHttpUrl(resource.fileUrl)
            ? resource.fileUrl
            : '';
        const rawLink = (linkUrl.trim() || persistedExternal).trim();
        data.append('fileUrl', isVideoType ? normalizeYoutubeWatchUrl(rawLink)! : rawLink);
      } else if (file) {
        data.append('file', file);
      }

      const res = resource ? await updateCourseContent(resource.id, data) : await createCourseContent(data);

      if (res.success) {
        toast({
          title: 'Success',
          description: `Resource ${resource ? 'updated' : 'added'} successfully`,
          variant: 'success',
        });
        onSuccess();
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save resource',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-slate-50/50 p-6 rounded-[24px] border border-slate-200 animate-in fade-in zoom-in duration-300"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Content Type
          </Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-xl">
              {contentTypes.map((t) => (
                <SelectItem key={t.value} value={t.value} className="font-bold py-3">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</Label>
          <Input
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Week 1 Lecture Slides"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject</Label>
          <Input
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.subjectTitle}
            onChange={(e) => setFormData({ ...formData, subjectTitle: e.target.value })}
            placeholder="e.g. Physics (required for structured curriculum)"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chapter</Label>
          <Input
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.chapterTitle}
            onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
            placeholder="e.g. Vectors"
          />
        </div>

        <div className="sm:col-span-2 space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            File or link
          </Label>
          <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-white border border-slate-200">
            <button
              type="button"
              onClick={() => setAttachmentMode('upload')}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                attachmentMode === 'upload' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setAttachmentMode('link')}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                attachmentMode === 'link' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Link2 className="h-4 w-4" />
              {isVideoType ? 'YouTube link' : 'External link'}
            </button>
          </div>
          {attachmentMode === 'upload' ? (
            <div className="relative group">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                {isVideoType ? 'Video file' : 'Attachment file'}
              </Label>
              <input
                type="file"
                accept={fileAccept}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="h-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center px-4 gap-3 group-hover:border-indigo-400 transition-all">
                <FileUp className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                <span className="text-sm font-bold text-slate-500 truncate">
                  {file
                    ? file.name
                    : resource?.fileUrl && isLocalUploadPath(resource.fileUrl)
                      ? 'Replace uploaded file'
                      : isVideoType
                        ? 'Choose video file'
                        : 'Choose file (optional for some types)'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                {isVideoType ? 'YouTube URL' : 'URL'}
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={
                  isVideoType
                    ? 'https://www.youtube.com/watch?v=… or youtu.be/…'
                    : 'https://… (Drive, Dropbox, hosted PDF, etc.)'
                }
              />
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-1">
                {isVideoType ? (
                  <>
                    Use <strong className="font-bold">Unlisted</strong>, not Private. The LMS stores a clean YouTube
                    watch URL and students see it through the anti-casual-sharing player.
                  </>
                ) : (
                  'Paste a direct https link. Students can open it from the lesson page (PDFs may preview inline).'
                )}
              </p>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Description (Optional)
          </Label>
          <Textarea
            className="min-h-[100px] rounded-[20px] border-slate-200 bg-white p-4 font-bold"
            value={formData.textBody}
            onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
            placeholder="Add detailed information or embed links..."
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm sm:col-span-2">
          <div className="space-y-0.5">
            <p className="text-sm font-black text-slate-800">Free Preview</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Allow non-enrolled students to view</p>
          </div>
          <Switch checked={formData.isFree} onCheckedChange={(v) => setFormData({ ...formData, isFree: v })} />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sort Order</Label>
          <Input
            type="number"
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Segment / topic label (optional)
          </Label>
          <Input
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.topicTitle}
            onChange={(e) => setFormData({ ...formData, topicTitle: e.target.value })}
            placeholder="e.g. 01 — Introduction"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chapter order</Label>
          <Input
            type="number"
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.topicSortOrder}
            onChange={(e) => setFormData({ ...formData, topicSortOrder: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Duration (minutes)
          </Label>
          <Input
            type="number"
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : resource ? 'Update' : 'Add Content'}
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
