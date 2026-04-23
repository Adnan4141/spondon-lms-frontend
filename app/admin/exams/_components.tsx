'use client';

/**
 * _components.tsx — Admin Exam list helpers.
 *
 * Exports a compact shadcn-only ExamFormModal (Create/Edit metadata) and an
 * ExamRow used inside the list Table. The heavy-weight blueprint builder now
 * lives on the detail page (`[id]/_builder-tab.tsx`), so this modal intentionally
 * only covers the minimum exam metadata required to land a DRAFT row.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { TableCell, TableRow } from '@/components/ui/table';

import { createExam, updateExam } from '@/lib/api/exams';
import type {
  Exam,
  ExamEngineType,
  ExamMode,
  ExamScope,
  ExamStatus,
} from '@/types/exam';
import type { Branch } from '@/lib/api/branches';

// ─────────────────────────────────────────────────────────────────────────────
// Shared config maps (exported for the list page)
// ─────────────────────────────────────────────────────────────────────────────

export const ENGINE_CONFIG: Record<
  ExamEngineType,
  { label: string; variant: 'default' | 'secondary' | 'outline'; desc: string }
> = {
  REGULAR: { label: 'MCQ', variant: 'default', desc: 'Auto-graded MCQ exam' },
  COMPETITIVE: { label: 'CQ / Written', variant: 'secondary', desc: 'Teacher-evaluated' },
  MULTI_SUBJECT: { label: 'Multi-Subject', variant: 'outline', desc: 'Combined subjects' },
  TALENT_HUNT: { label: 'Talent Hunt', variant: 'secondary', desc: 'Special competitive' },
  OMR_BOOK: { label: 'OMR Sheet', variant: 'outline', desc: 'Scanned OMR' },
  UNIVERSITY_SPECIAL: { label: 'University', variant: 'secondary', desc: 'Admission format' },
};

export const MODE_CONFIG: Record<ExamMode, { label: string }> = {
  ONLINE: { label: 'Online' },
  OFFLINE: { label: 'Offline' },
  WRITTEN: { label: 'Written' },
};

export const STATUS_CONFIG: Record<
  ExamStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ExamFormModal
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  courseId: string;
  branchId: string;
  title: string;
  examEngine: ExamEngineType;
  mode: ExamMode;
  scope: ExamScope;
  status: ExamStatus;
  durationMinutes: number;
  totalSets: number;
  allowedAttempts: number;
  startAt: Date | undefined;
  endAt: Date | undefined;
  showLeaderboard: boolean;
  hideResult: boolean;
  description: string;
}

const DEFAULTS: FormState = {
  courseId: '',
  branchId: '',
  title: '',
  examEngine: 'REGULAR',
  mode: 'ONLINE',
  scope: 'COURSE',
  status: 'DRAFT',
  durationMinutes: 30,
  totalSets: 1,
  allowedAttempts: 1,
  startAt: undefined,
  endAt: undefined,
  showLeaderboard: false,
  hideResult: false,
  description: '',
};

function examToForm(exam: Exam): FormState {
  const settings = (exam.settings ?? {}) as Record<string, unknown>;
  return {
    courseId: exam.courseId,
    branchId: exam.branchId ?? '',
    title: exam.title,
    examEngine: exam.examEngine ?? 'REGULAR',
    mode: exam.mode,
    scope: exam.scope ?? 'COURSE',
    status: exam.status,
    durationMinutes: exam.durationMinutes ?? 30,
    totalSets: exam.totalSets ?? 1,
    allowedAttempts: exam.allowedAttempts ?? 1,
    startAt: exam.startAt ? new Date(exam.startAt) : undefined,
    endAt: exam.endAt ? new Date(exam.endAt) : undefined,
    showLeaderboard: exam.showLeaderboard ?? false,
    hideResult: Boolean(settings.hideResult),
    description: (settings.description as string) ?? '',
  };
}

export function ExamFormModal({
  open,
  onClose,
  onSaved,
  exam,
  courses,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (exam: Exam) => void;
  exam?: Exam | null;
  courses: { id: string; name: string }[];
  branches: Pick<Branch, 'id' | 'name'>[];
}) {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(exam ? examToForm(exam) : DEFAULTS);
    setError('');
    setSaving(false);
  }, [open, exam]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required');
    if (!form.courseId) return setError('Please select a course');
    if (!form.branchId) return setError('Please select a branch');

    setSaving(true);
    setError('');
    try {
      const payload = {
        courseId: form.courseId,
        branchId: form.branchId,
        title: form.title.trim(),
        type: 'SCHEDULED' as const,
        examEngine: form.examEngine,
        mode: form.mode,
        scope: form.scope,
        status: form.status,
        durationMinutes: form.durationMinutes || undefined,
        allowedAttempts: form.allowedAttempts,
        totalSets: form.totalSets || undefined,
        showLeaderboard: form.showLeaderboard,
        hideResult: form.hideResult,
        startAt: form.startAt ? form.startAt.toISOString() : undefined,
        endAt: form.endAt ? form.endAt.toISOString() : undefined,
        settings: {
          description: form.description.trim() || undefined,
          hideResult: form.hideResult,
        },
      };

      const res = exam?.id
        ? await updateExam(exam.id, payload)
        : await createExam(payload);
      if (!res.success || !res.data) {
        throw new Error((res as { message?: string }).message ?? 'Save failed');
      }
      onSaved(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam?.id ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
          <DialogDescription>
            Basic exam metadata. Configure sections, folder rules and generate sets
            from the exam detail page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="exam-title">Title</Label>
            <Input
              id="exam-title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Weekly MCQ Test — Physics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Course</Label>
              <Select
                value={form.courseId}
                onValueChange={(v) => setField('courseId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Branch</Label>
              <Select
                value={form.branchId}
                onValueChange={(v) => setField('branchId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Engine</Label>
              <Select
                value={form.examEngine}
                onValueChange={(v) => setField('examEngine', v as ExamEngineType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENGINE_CONFIG) as ExamEngineType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ENGINE_CONFIG[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setField('mode', v as ExamMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['ONLINE', 'OFFLINE', 'WRITTEN'] as ExamMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_CONFIG[m].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onValueChange={(v) => setField('scope', v as ExamScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COURSE">Enrolled only</SelectItem>
                  <SelectItem value="GLOBAL">Open to all</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setField('durationMinutes', Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Total sets</Label>
              <Input
                type="number"
                min={1}
                value={form.totalSets}
                onChange={(e) => setField('totalSets', Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Attempts</Label>
              <Input
                type="number"
                min={1}
                value={form.allowedAttempts}
                onChange={(e) => setField('allowedAttempts', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start at</Label>
              <DateTimePicker
                date={form.startAt}
                setDate={(d) => setField('startAt', d)}
                placeholder="Pick start date/time"
              />
            </div>
            <div className="grid gap-2">
              <Label>End at</Label>
              <DateTimePicker
                date={form.endAt}
                setDate={(d) => setField('endAt', d)}
                placeholder="Pick end date/time"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exam-description">Description (optional)</Label>
            <Textarea
              id="exam-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Internal notes / instructions visible to students"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="show-leaderboard" className="text-sm">
                Show leaderboard
              </Label>
              <Switch
                id="show-leaderboard"
                checked={form.showLeaderboard}
                onCheckedChange={(v) => setField('showLeaderboard', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="hide-result" className="text-sm">
                Hide result until released
              </Label>
              <Switch
                id="hide-result"
                checked={form.hideResult}
                onCheckedChange={(v) => setField('hideResult', v)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setField('status', v as ExamStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['DRAFT', 'PUBLISHED', 'CLOSED'] as ExamStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : exam?.id ? 'Save changes' : 'Create exam'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backwards-compatibility alias — the old page imported this name.
export { ExamFormModal as ExamWizardModal };

// ─────────────────────────────────────────────────────────────────────────────
// ExamRow
// ─────────────────────────────────────────────────────────────────────────────

export function ExamRow({
  exam,
  onEdit,
  onDelete,
  onPublish,
}: {
  exam: Exam;
  onEdit: (e: Exam) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const engineCfg = ENGINE_CONFIG[exam.examEngine ?? 'REGULAR'] ?? ENGINE_CONFIG.REGULAR;
  const modeCfg = MODE_CONFIG[exam.mode];
  const statusCfg = STATUS_CONFIG[exam.status];
  const settings = (exam.settings ?? {}) as Record<string, unknown>;

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="font-semibold">{exam.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={engineCfg.variant}>{engineCfg.label}</Badge>
          <Badge variant="outline">{modeCfg.label}</Badge>
          {exam.scope === 'GLOBAL' && <Badge variant="secondary">Global</Badge>}
        </div>
      </TableCell>
      <TableCell className="text-center align-top">
        {(settings.questionCount as number) ?? '—'}
      </TableCell>
      <TableCell className="text-center align-top">
        {exam.durationMinutes ?? '—'}
      </TableCell>
      <TableCell className="text-center align-top">
        {(settings.totalMarks as number) ?? '—'}
      </TableCell>
      <TableCell className="text-center align-top">{exam.totalSets ?? 1}</TableCell>
      <TableCell className="text-center align-top">
        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
      </TableCell>
      <TableCell className="text-center text-xs text-muted-foreground align-top">
        {exam.startAt ? exam.startAt.slice(0, 10) : '—'}
      </TableCell>
      <TableCell className="align-top">
        <div className="flex justify-end gap-1.5">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/exams/${exam.id}`}>
              <Settings className="mr-1 h-3.5 w-3.5" />
              Manage
            </Link>
          </Button>
          {exam.status === 'DRAFT' && (
            <Button size="sm" variant="outline" onClick={() => onPublish(exam.id)}>
              <Eye className="mr-1 h-3.5 w-3.5" />
              Publish
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onEdit(exam)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(exam.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
