'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Lock, Medal, RefreshCw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createMeritSnapshot,
  listMeritSnapshots,
  lockMeritSnapshot,
  publishMeritSnapshot,
  reopenMeritSnapshot,
  type MeritSnapshotSummary,
} from '@/lib/api/exams';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { promptAction } from '@/features/admin/shared/prompt-action';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';

type Props = {
  examId: string;
  canPublish: boolean;
  canReopen: boolean;
  onPublished: () => void;
};

const MERIT_TYPES = ['ALL', 'ONLINE', 'OFFLINE'] as const;

function statusTone(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'LOCKED') return 'bg-blue-50 text-blue-800 border-blue-200';
  if (status === 'REOPENED') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function MeritPublishPanel({ examId, canPublish, canReopen, onPublished }: Props) {
  const toast = useAdminToast();
  const [meritType, setMeritType] = useState<(typeof MERIT_TYPES)[number]>('ALL');
  const [snapshots, setSnapshots] = useState<MeritSnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listMeritSnapshots(examId);
      setSnapshots(response.success && response.data ? response.data : []);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (snapshotId: string, label: string, action: () => Promise<{ success?: boolean; message?: string }>) => {
    setBusyId(snapshotId);
    try {
      const response = await action();
      if (!response.success) throw new Error(response.message || `${label} failed`);
      toast({ title: label });
      await load();
      onPublished();
    } catch (error) {
      toast({
        title: label,
        description: error instanceof Error ? error.message : 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    if (!canPublish) return;
    setBusyId('create');
    try {
      const response = await createMeritSnapshot(examId, meritType);
      if (!response.success) throw new Error(response.message || 'Could not create snapshot');
      toast({ title: 'Merit snapshot draft created' });
      await load();
    } catch (error) {
      toast({
        title: 'Create snapshot failed',
        description: error instanceof Error ? error.message : 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!canPublish && !canReopen) return null;

  return (
    <Card className="border-[#C8A96E]/40 bg-[#FBF4E6]/40 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#0D1B35]">
            <Medal className="h-5 w-5" />
            Merit publishing
          </CardTitle>
          <CardDescription>
            Create a frozen merit snapshot, lock it for review, then publish so students see official ranks.
          </CardDescription>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {canPublish ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-600">Snapshot type</p>
              <Select value={meritType} onValueChange={(v) => setMeritType(v as (typeof MERIT_TYPES)[number])}>
                <SelectTrigger className="h-9 w-40 border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MERIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'ALL' ? 'Combined' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]"
              disabled={busyId === 'create'}
              onClick={() => void handleCreate()}
            >
              {busyId === 'create' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Create draft snapshot
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading snapshots…
          </div>
        ) : snapshots.length === 0 ? (
          <p className="text-sm text-slate-500">No merit snapshots yet. Create a draft when results are ready.</p>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snapshot) => {
              const busy = busyId === snapshot.id;
              return (
                <div
                  key={snapshot.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {snapshot.meritType} · v{snapshot.version}
                      </span>
                      <Badge variant="outline" className={statusTone(snapshot.status)}>
                        {snapshot.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Created {new Date(snapshot.generatedAt).toLocaleString()}
                      {snapshot.publishedAt ? ` · Published ${new Date(snapshot.publishedAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canPublish && snapshot.status === 'DRAFT' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void runAction(snapshot.id, 'Snapshot locked', () => lockMeritSnapshot(examId, snapshot.id))}
                      >
                        {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Lock className="mr-1 h-3 w-3" />}
                        Lock
                      </Button>
                    ) : null}
                    {canPublish && ['DRAFT', 'LOCKED'].includes(snapshot.status) ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void runAction(snapshot.id, 'Merit published', () => publishMeritSnapshot(examId, snapshot.id))}
                      >
                        {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                        Publish
                      </Button>
                    ) : null}
                    {canReopen && snapshot.status === 'PUBLISHED' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={async () => {
                          const ok = await confirmAction({
                            title: 'Reopen merit snapshot?',
                            description: 'Students may see updated ranks after a new snapshot is published.',
                            confirmLabel: 'Reopen',
                          });
                          if (!ok) return;
                          const reason = await promptAction({
                            title: 'Reopen merit list',
                            description: 'Reason for reopening this merit list.',
                            placeholder: 'Reason',
                            confirmLabel: 'Reopen',
                            multiline: true,
                          });
                          if (!reason?.trim()) return;
                          await runAction(snapshot.id, 'Merit reopened', () =>
                            reopenMeritSnapshot(examId, snapshot.id, reason.trim()),
                          );
                        }}
                      >
                        Reopen
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
