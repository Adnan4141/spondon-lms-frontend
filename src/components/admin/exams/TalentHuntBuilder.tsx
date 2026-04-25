'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createTalentHunt,
  getTalentHuntByExamId,
  updateTalentHunt,
  addTalentHuntStage,
  updateTalentHuntStage,
  deleteTalentHuntStage,
  runTalentHuntAdvancement,
  addTalentHuntPrize,
  updateTalentHuntPrize,
  deleteTalentHuntPrize,
} from '@/lib/api/exams';
import type { TalentHunt, TalentHuntStage, TalentHuntPrize } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  Users,
  Award,
  Zap,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-green-100 text-green-700',
  SCORING: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-red-100 text-red-700',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Stage Row ───────────────────────────────────────────────────────────────

function StageRow({
  stage,
  thId,
  onRefresh,
}: {
  stage: TalentHuntStage;
  thId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: stage.name,
    linkedExamId: stage.linkedExamId ?? '',
    cutoffScore: String(stage.cutoffScore),
    topNAdvance: String(stage.topNAdvance),
    opensAt: stage.opensAt ?? '',
    closesAt: stage.closesAt ?? '',
    status: stage.status,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTalentHuntStage(thId, stage.id, {
        name: draft.name,
        linkedExamId: draft.linkedExamId || undefined,
        cutoffScore: parseFloat(draft.cutoffScore) || 0,
        topNAdvance: parseInt(draft.topNAdvance) || 500,
        opensAt: draft.opensAt || undefined,
        closesAt: draft.closesAt || undefined,
        status: draft.status,
      });
      toast({ title: 'Stage updated' });
      onRefresh();
    } catch {
      toast({ title: 'Failed to update stage', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete stage "${stage.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteTalentHuntStage(thId, stage.id);
      toast({ title: 'Stage deleted' });
      onRefresh();
    } catch {
      toast({ title: 'Failed to delete stage', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleAdvance = async () => {
    if (!stage.linkedExamId) {
      toast({ title: 'Set a linked exam first', variant: 'destructive' });
      return;
    }
    if (!confirm(`Run advancement for "${stage.name}"? This will rank all attempts and select top ${stage.topNAdvance}.`)) return;
    setAdvancing(true);
    try {
      const res = await runTalentHuntAdvancement(thId, stage.id);
      if (res.success) {
        toast({ title: `${res.data?.advanced ?? 0} students advanced!` });
        onRefresh();
      } else {
        toast({ title: res.message || 'Advancement failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Advancement job failed', variant: 'destructive' });
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold">
          {stage.stageNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{stage.name}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', STAGE_STATUS_COLORS[stage.status])}>
              {stage.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Cutoff: {stage.cutoffScore} · Top {stage.topNAdvance} · {formatDate(stage.opensAt)} – {formatDate(stage.closesAt)}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(stage.status === 'OPEN' || stage.status === 'SCORING') && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
              disabled={advancing}
            >
              {advancing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
              Advance
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-rose-600"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-bold">Stage name</Label>
              <Input className="mt-1 h-8 text-sm" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-bold">Linked Exam ID</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="Exam ID" value={draft.linkedExamId} onChange={(e) => setDraft((d) => ({ ...d, linkedExamId: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-bold">Cutoff score</Label>
              <Input type="number" min={0} className="mt-1 h-8 text-sm" value={draft.cutoffScore} onChange={(e) => setDraft((d) => ({ ...d, cutoffScore: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-bold">Top N advance</Label>
              <Input type="number" min={1} className="mt-1 h-8 text-sm" value={draft.topNAdvance} onChange={(e) => setDraft((d) => ({ ...d, topNAdvance: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-bold">Opens at</Label>
              <DateTimePicker
                date={draft.opensAt ? new Date(draft.opensAt) : undefined}
                setDate={(d) => setDraft((s) => ({ ...s, opensAt: d ? d.toISOString() : '' }))}
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Closes at</Label>
              <DateTimePicker
                date={draft.closesAt ? new Date(draft.closesAt) : undefined}
                setDate={(d) => setDraft((s) => ({ ...s, closesAt: d ? d.toISOString() : '' }))}
              />
            </div>
          </div>

          {/* Advancements summary */}
          {(stage.advancements?.length ?? 0) > 0 && (
            <div className="rounded-lg bg-green-50 p-2 text-xs text-green-700">
              <Check className="inline h-3.5 w-3.5 mr-1" />
              {stage.advancements!.length} students advanced in this stage
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save Stage
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Prize Row ───────────────────────────────────────────────────────────────

function PrizeRow({
  prize,
  thId,
  onRefresh,
}: {
  prize: TalentHuntPrize;
  thId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTalentHuntPrize(thId, prize.id);
      toast({ title: 'Prize removed' });
      onRefresh();
    } catch {
      toast({ title: 'Failed to remove prize', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4 text-sm font-medium text-slate-800">#{prize.rankFrom}–{prize.rankTo}</td>
      <td className="py-2 pr-4 text-sm text-slate-600">{prize.label}</td>
      <td className="py-2 pr-4 text-sm text-slate-600">{prize.prizeType}</td>
      <td className="py-2 pr-4 text-sm font-semibold text-indigo-700">{prize.amount}</td>
      <td className="py-2 text-right">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-slate-400 hover:text-rose-600"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </td>
    </tr>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TalentHuntBuilder({
  examId,
  onSaved,
}: {
  examId: string;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [th, setTh] = useState<TalentHunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addingStage, setAddingStage] = useState(false);
  const [addingPrize, setAddingPrize] = useState(false);

  // Settings form
  const [settings, setSettings] = useState({
    title: '',
    registrationOpensAt: '',
    registrationClosesAt: '',
    autoAdvance: true,
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'CLOSED',
  });

  // New stage form
  const [newStage, setNewStage] = useState({ name: '', linkedExamId: '', cutoffScore: '0', topNAdvance: '500' });

  // New prize form
  const [newPrize, setNewPrize] = useState({ rankFrom: '1', rankTo: '1', prizeType: 'CASH', amount: '', label: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTalentHuntByExamId(examId);
      if (res.success && res.data) {
        setTh(res.data);
        setSettings({
          title: res.data.title,
          registrationOpensAt: res.data.registrationOpensAt ?? '',
          registrationClosesAt: res.data.registrationClosesAt ?? '',
          autoAdvance: res.data.autoAdvance,
          status: res.data.status,
        });
      }
    } catch {
      // not found is expected on first load
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateOrSave = async () => {
    setSavingSettings(true);
    try {
      if (!th) {
        // Create
        const res = await createTalentHunt({
          examId,
          title: settings.title || 'Talent Hunt',
          registrationOpensAt: settings.registrationOpensAt || undefined,
          registrationClosesAt: settings.registrationClosesAt || undefined,
          autoAdvance: settings.autoAdvance,
        });
        if (res.success) {
          toast({ title: 'Talent Hunt created' });
          load();
          onSaved?.();
        } else {
          toast({ title: res.message || 'Failed', variant: 'destructive' });
        }
      } else {
        // Update
        await updateTalentHunt(th.id, {
          title: settings.title,
          registrationOpensAt: settings.registrationOpensAt || null,
          registrationClosesAt: settings.registrationClosesAt || null,
          autoAdvance: settings.autoAdvance,
          status: settings.status,
        });
        toast({ title: 'Settings saved' });
        load();
        onSaved?.();
      }
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddStage = async () => {
    if (!th || !newStage.name.trim()) return;
    setAddingStage(true);
    try {
      await addTalentHuntStage(th.id, {
        name: newStage.name.trim(),
        linkedExamId: newStage.linkedExamId || undefined,
        cutoffScore: parseFloat(newStage.cutoffScore) || 0,
        topNAdvance: parseInt(newStage.topNAdvance) || 500,
      });
      toast({ title: 'Stage added' });
      setNewStage({ name: '', linkedExamId: '', cutoffScore: '0', topNAdvance: '500' });
      load();
    } catch {
      toast({ title: 'Failed to add stage', variant: 'destructive' });
    } finally {
      setAddingStage(false);
    }
  };

  const handleAddPrize = async () => {
    if (!th || !newPrize.amount || !newPrize.label) return;
    setAddingPrize(true);
    try {
      await addTalentHuntPrize(th.id, {
        rankFrom: parseInt(newPrize.rankFrom) || 1,
        rankTo: parseInt(newPrize.rankTo) || 1,
        prizeType: newPrize.prizeType,
        amount: newPrize.amount,
        label: newPrize.label,
      });
      toast({ title: 'Prize added' });
      setNewPrize({ rankFrom: '1', rankTo: '1', prizeType: 'CASH', amount: '', label: '' });
      load();
    } catch {
      toast({ title: 'Failed to add prize', variant: 'destructive' });
    } finally {
      setAddingPrize(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Talent Hunt Builder</h3>
          <p className="text-xs text-slate-500">Configure stages, prizes, and eligibility rules</p>
        </div>
        {th && (
          <Badge className={cn('ml-auto', th.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : th.status === 'CLOSED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600')}>
            {th.status}
          </Badge>
        )}
      </div>

      {!th && (
        <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-6 text-center">
          <Trophy className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">No Talent Hunt configured yet</p>
          <p className="text-xs text-slate-400 mb-3">Set a title and save to begin building stages</p>
          <div className="max-w-xs mx-auto space-y-2">
            <Input
              placeholder="Talent Hunt title…"
              value={settings.title}
              onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
            />
            <Button className="w-full" onClick={handleCreateOrSave} disabled={savingSettings || !settings.title.trim()}>
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Create Talent Hunt
            </Button>
          </div>
        </div>
      )}

      {th && (
        <Tabs defaultValue="stages">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="stages" className="text-xs gap-1"><Calendar className="h-3 w-3" />Stages</TabsTrigger>
            <TabsTrigger value="prizes" className="text-xs gap-1"><Award className="h-3 w-3" />Prizes</TabsTrigger>
            <TabsTrigger value="eligibility" className="text-xs gap-1"><Users className="h-3 w-3" />Eligibility</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs gap-1"><Trophy className="h-3 w-3" />Leaderboard</TabsTrigger>
          </TabsList>

          {/* ── Stages ──────────────────────────────────────────── */}
          <TabsContent value="stages" className="space-y-3 mt-3">
            {th.stages.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
                <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                No stages yet. Add the first stage below.
              </div>
            )}

            {th.stages.map((stage) => (
              <StageRow key={stage.id} stage={stage} thId={th.id} onRefresh={load} />
            ))}

            {/* Add stage form */}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Stage</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Input
                  placeholder="Stage name"
                  className="h-8 text-sm"
                  value={newStage.name}
                  onChange={(e) => setNewStage((s) => ({ ...s, name: e.target.value }))}
                />
                <Input
                  placeholder="Linked Exam ID"
                  className="h-8 text-sm"
                  value={newStage.linkedExamId}
                  onChange={(e) => setNewStage((s) => ({ ...s, linkedExamId: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Cutoff"
                  className="h-8 text-sm"
                  value={newStage.cutoffScore}
                  onChange={(e) => setNewStage((s) => ({ ...s, cutoffScore: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Top N"
                  className="h-8 text-sm"
                  value={newStage.topNAdvance}
                  onChange={(e) => setNewStage((s) => ({ ...s, topNAdvance: e.target.value }))}
                />
              </div>
              <Button size="sm" onClick={handleAddStage} disabled={addingStage || !newStage.name.trim()}>
                {addingStage ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Add Stage
              </Button>
            </div>
          </TabsContent>

          {/* ── Prizes ──────────────────────────────────────────── */}
          <TabsContent value="prizes" className="mt-3 space-y-3">
            {th.prizes.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 px-3">
                    {th.prizes.map((p) => (
                      <PrizeRow key={p.id} prize={p} thId={th.id} onRefresh={load} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-400">No prizes configured yet.</div>
            )}

            {/* Add prize */}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Prize Tier</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Input placeholder="Label (e.g. 1st Place)" className="h-8 text-sm" value={newPrize.label} onChange={(e) => setNewPrize((p) => ({ ...p, label: e.target.value }))} />
                <Input placeholder="Amount (e.g. 10,000 BDT)" className="h-8 text-sm" value={newPrize.amount} onChange={(e) => setNewPrize((p) => ({ ...p, amount: e.target.value }))} />
                <Input placeholder="Type (CASH / SCHOLARSHIP)" className="h-8 text-sm" value={newPrize.prizeType} onChange={(e) => setNewPrize((p) => ({ ...p, prizeType: e.target.value }))} />
                <div className="flex items-center gap-1">
                  <Input type="number" min={1} placeholder="From rank" className="h-8 text-sm" value={newPrize.rankFrom} onChange={(e) => setNewPrize((p) => ({ ...p, rankFrom: e.target.value }))} />
                  <span className="text-xs text-slate-400">–</span>
                  <Input type="number" min={1} placeholder="To rank" className="h-8 text-sm" value={newPrize.rankTo} onChange={(e) => setNewPrize((p) => ({ ...p, rankTo: e.target.value }))} />
                </div>
              </div>
              <Button size="sm" onClick={handleAddPrize} disabled={addingPrize || !newPrize.label || !newPrize.amount}>
                {addingPrize ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Add Prize
              </Button>
            </div>
          </TabsContent>

          {/* ── Eligibility ──────────────────────────────────────── */}
          <TabsContent value="eligibility" className="mt-3 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div>
                <Label className="text-xs font-bold">Talent Hunt Title</Label>
                <Input
                  className="mt-1"
                  value={settings.title}
                  onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold">Registration opens</Label>
                  <DateTimePicker
                    date={settings.registrationOpensAt ? new Date(settings.registrationOpensAt) : undefined}
                    setDate={(d) => setSettings((s) => ({ ...s, registrationOpensAt: d ? d.toISOString() : '' }))}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Registration closes</Label>
                  <DateTimePicker
                    date={settings.registrationClosesAt ? new Date(settings.registrationClosesAt) : undefined}
                    setDate={(d) => setSettings((s) => ({ ...s, registrationClosesAt: d ? d.toISOString() : '' }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.autoAdvance}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, autoAdvance: v }))}
                  id="auto-advance"
                />
                <Label htmlFor="auto-advance" className="text-sm cursor-pointer">
                  Auto-advance students to next stage after advancement job runs
                </Label>
              </div>
              <div>
                <Label className="text-xs font-bold">Status</Label>
                <div className="flex gap-2 mt-1">
                  {(['DRAFT', 'ACTIVE', 'CLOSED'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, status: s }))}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold border transition-all',
                        settings.status === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateOrSave} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Leaderboard preview ──────────────────────────────── */}
          <TabsContent value="leaderboard" className="mt-3">
            {th.stages.every((s) => !s.advancements?.length) ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-400">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Leaderboard will appear here after the first advancement job runs.
              </div>
            ) : (
              <div className="space-y-4">
                {th.stages
                  .filter((s) => (s.advancements?.length ?? 0) > 0)
                  .map((stage) => (
                    <div key={stage.id}>
                      <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Stage {stage.stageNumber}: {stage.name}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <th className="px-3 py-2">Rank</th>
                              <th className="px-3 py-2">Student ID</th>
                              <th className="px-3 py-2">Score</th>
                              <th className="px-3 py-2">Advanced</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stage.advancements!.map((adv) => (
                              <tr key={adv.id} className="border-b border-slate-50 last:border-0">
                                <td className="px-3 py-2 text-sm font-bold text-slate-700">#{adv.rank}</td>
                                <td className="px-3 py-2 text-xs text-slate-600 font-mono">{adv.studentId}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-indigo-700">{adv.score}</td>
                                <td className="px-3 py-2">
                                  {adv.advancedToNextStage ? (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 rounded-full px-2 py-0.5">Yes</span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">No</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
