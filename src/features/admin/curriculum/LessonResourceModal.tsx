'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { createLessonResource, updateLessonResource } from '@/lib/api/curriculum';
import { cn } from '@/lib/utils';
import type { CurriculumVisibility, LessonResourceRow, LessonResourceType } from './curriculum-types';

const RESOURCE_TYPES: { value: LessonResourceType; label: string }[] = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'NOTE', label: 'Note' },
  { value: 'PDF', label: 'PDF' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'LIVE', label: 'Live' },
  { value: 'LINK', label: 'Link' },
  { value: 'SAMPLE', label: 'Sample' },
  { value: 'OTHER', label: 'Other' },
];

function parseIsoToDate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function LessonResourceModal({
  open,
  onClose,
  lessonId,
  breadcrumbTitles,
  edit,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  /** Root → … → lesson titles (inclusive). Shown as context; not editable. */
  breadcrumbTitles: string[];
  edit?: LessonResourceRow | null;
  onSaved: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonResourceType>('VIDEO');
  const [sortOrder, setSortOrder] = useState('');
  const [visibility, setVisibility] = useState<CurriculumVisibility>('VISIBLE');
  const [isFree, setIsFree] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [duration, setDuration] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [publishAt, setPublishAt] = useState<Date | undefined>();
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const breadcrumbText = useMemo(() => breadcrumbTitles.filter(Boolean).join(' › '), [breadcrumbTitles]);

  useEffect(() => {
    if (!open) return;
    setTitle(edit?.title ?? '');
    setType((edit?.type as LessonResourceType) || 'VIDEO');
    setSortOrder(edit != null ? String(edit.sortOrder ?? '') : '');
    setVisibility((edit?.visibility as CurriculumVisibility) || 'VISIBLE');
    setIsFree(!!edit?.isFree);
    setDownloadAllowed(!!edit?.downloadAllowed);
    setIsRequired(!!edit?.isRequired);
    setDuration(edit?.durationMinutes != null ? String(edit.durationMinutes) : '');
    setUrl(edit?.externalUrl || '');
    setThumbnailUrl(edit?.thumbnailUrl || '');
    setPublishAt(parseIsoToDate(edit?.publishAt ?? null));
    setScheduledAt(parseIsoToDate(edit?.scheduledAt ?? null));
    setTab(edit?.fileUrl && !edit?.externalUrl ? 'file' : edit?.externalUrl ? 'url' : 'file');
    setFile(null);
    setThumbnailFile(null);
  }, [open, edit]);

  const submit = async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('title', title.trim() || 'Untitled');
      fd.append('isFree', String(isFree));
      fd.append('downloadAllowed', String(downloadAllowed));
      fd.append('isRequired', String(isRequired));
      fd.append('visibility', visibility);
      if (sortOrder.trim() !== '') fd.append('sortOrder', sortOrder.trim());
      if (duration.trim()) fd.append('durationMinutes', duration.trim());
      if (tab === 'url' && url.trim()) fd.append('externalUrl', url.trim());
      if (file) fd.append('file', file);
      if (thumbnailUrl.trim()) fd.append('thumbnailUrl', thumbnailUrl.trim());
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
      if (publishAt) fd.append('publishAt', publishAt.toISOString());
      else if (edit) fd.append('publishAt', '');
      if (scheduledAt) fd.append('scheduledAt', scheduledAt.toISOString());
      else if (edit) fd.append('scheduledAt', '');

      if (edit) {
        await updateLessonResource(edit.id, fd);
      } else {
        await createLessonResource(lessonId, fd);
      }
      toast({ title: 'Resource saved' });
      await onSaved();
    } catch (e: unknown) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[min(92vh,720px)] max-w-lg overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{edit ? 'Edit resource' : 'Add resource'}</DialogTitle>
          <DialogDescription className="sr-only">Attach a file or link under the selected lesson.</DialogDescription>
        </DialogHeader>

        {breadcrumbText ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-wide text-slate-400">Lesson context</p>
            <p className="mt-0.5 font-medium text-slate-800">{breadcrumbText}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Subject and chapter are taken from the tree — you only define this attachment below.
            </p>
          </div>
        ) : null}

        <div className="space-y-4 py-1">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Basics</CardTitle>
              <CardDescription className="text-xs">
                <span className="font-medium text-slate-700">Student-facing title</span> — shown in the player and
                lists. The lesson unit name is edited in the tree, not here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as LessonResourceType)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Student-facing title</Label>
                <Input className="rounded-lg" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Order in lesson</Label>
                <Input
                  type="number"
                  className="rounded-lg"
                  placeholder={edit ? String(edit.sortOrder) : 'Auto'}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">Lower numbers appear first. Leave empty on new items to append.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Delivery</CardTitle>
              <CardDescription className="text-xs">Optional schedule and visibility for this file or link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as CurriculumVisibility)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISIBLE">Visible to students</SelectItem>
                    <SelectItem value="HIDDEN">Hidden (admin only)</SelectItem>
                    <SelectItem value="DRAFT">Draft (not published)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Publish at (resource)</Label>
                <DateTimePicker
                  date={publishAt}
                  setDate={setPublishAt}
                  placeholder="Optional — unlocks at this time"
                />
              </div>
              {type === 'LIVE' && (
                <div className="grid gap-2">
                  <Label>Live session start</Label>
                  <DateTimePicker date={scheduledAt} setDate={setScheduledAt} placeholder="When the live class runs" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'file' | 'url')}>
                <TabsList className="grid w-full grid-cols-2 rounded-lg">
                  <TabsTrigger value="file" className="rounded-md">
                    Local file
                  </TabsTrigger>
                  <TabsTrigger value="url" className="rounded-md">
                    External URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="mt-3 space-y-2">
                  <Input type="file" className="rounded-lg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <p className="text-xs text-slate-500">Optional if you use the URL tab or keep an existing upload.</p>
                </TabsContent>
                <TabsContent value="url" className="mt-3">
                  <Input className="rounded-lg" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
                </TabsContent>
              </Tabs>
              <div className="grid gap-2">
                <Label>Thumbnail URL (optional)</Label>
                <Input
                  className="rounded-lg"
                  placeholder="https://… or /uploads/…"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Thumbnail file (optional)</Label>
                <Input type="file" accept="image/*" className="rounded-lg" onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Access & completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn('flex items-center justify-between rounded-lg border px-3 py-2')}>
                <Label className="text-sm">Free access</Label>
                <Switch checked={isFree} onCheckedChange={setIsFree} />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label className="text-sm">Download allowed</Label>
                <Switch checked={downloadAllowed} onCheckedChange={setDownloadAllowed} />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <Label className="text-sm">Mandatory for completion</Label>
                  <p className="text-[11px] text-slate-500">Used for future “complete lesson” rules.</p>
                </div>
                <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              </div>
              {(type === 'VIDEO' || type === 'LIVE') && (
                <div className="grid gap-2">
                  <Label>Estimated minutes (optional)</Label>
                  <Input className="rounded-lg" value={duration} onChange={(e) => setDuration(e.target.value)} type="number" min={0} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button className="rounded-xl" disabled={loading} onClick={submit}>
            {loading ? 'Saving…' : 'Save resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
