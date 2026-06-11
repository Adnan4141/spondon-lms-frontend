'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { ApiError } from '@/lib/api';
import {
  addTalentHuntPrize,
  addTalentHuntStage,
  createTalentHunt,
  getTalentHuntByExamId,
  runTalentHuntAdvancement,
  updateTalentHunt,
} from '@/lib/api/exams';
import type { TalentHunt, TalentHuntPrize, TalentHuntStage } from '@/types/exam';

type Props = {
  examId: string;
  examTitle: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-rose-100 text-rose-700',
  PENDING: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-blue-100 text-blue-700',
  SCORING: 'bg-amber-100 text-amber-800',
};

export function TalentHuntPanel({ examId, examTitle }: Props) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [talentHunt, setTalentHunt] = useState<TalentHunt | null>(null);
  const [stageName, setStageName] = useState('');
  const [linkedExamId, setLinkedExamId] = useState('');
  const [cutoffScore, setCutoffScore] = useState('0');
  const [topNAdvance, setTopNAdvance] = useState('500');
  const [prizeLabel, setPrizeLabel] = useState('');
  const [prizeRankFrom, setPrizeRankFrom] = useState('1');
  const [prizeRankTo, setPrizeRankTo] = useState('1');
  const [prizeAmount, setPrizeAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTalentHuntByExamId(examId);
      if (response.success && response.data) {
        setTalentHunt(response.data);
        return;
      }
      setTalentHunt(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setTalentHunt(null);
        return;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createHunt = async () => {
    setBusy(true);
    try {
      const response = await createTalentHunt({
        examId,
        title: examTitle,
        autoAdvance: true,
      });
      if (!response.success || !response.data) {
        toast({ title: response.message ?? 'Could not create talent hunt', variant: 'destructive' });
        return;
      }
      setTalentHunt(response.data);
      toast({ title: 'Talent hunt created' });
    } finally {
      setBusy(false);
    }
  };

  const activateHunt = async () => {
    if (!talentHunt) return;
    setBusy(true);
    try {
      const response = await updateTalentHunt(talentHunt.id, { status: 'ACTIVE' });
      if (!response.success || !response.data) {
        toast({ title: response.message ?? 'Update failed', variant: 'destructive' });
        return;
      }
      setTalentHunt(response.data);
      toast({ title: 'Talent hunt activated' });
    } finally {
      setBusy(false);
    }
  };

  const addStage = async () => {
    if (!talentHunt || !stageName.trim()) return;
    setBusy(true);
    try {
      const response = await addTalentHuntStage(talentHunt.id, {
        name: stageName.trim(),
        linkedExamId: linkedExamId.trim() || undefined,
        cutoffScore: Number(cutoffScore) || 0,
        topNAdvance: Number(topNAdvance) || 500,
      });
      if (!response.success) {
        toast({ title: response.message ?? 'Could not add stage', variant: 'destructive' });
        return;
      }
      setStageName('');
      setLinkedExamId('');
      await load();
      toast({ title: 'Stage added' });
    } finally {
      setBusy(false);
    }
  };

  const addPrize = async () => {
    if (!talentHunt || !prizeLabel.trim()) return;
    setBusy(true);
    try {
      const response = await addTalentHuntPrize(talentHunt.id, {
        label: prizeLabel.trim(),
        prizeType: 'CASH',
        rankFrom: Number(prizeRankFrom) || 1,
        rankTo: Number(prizeRankTo) || 1,
        amount: prizeAmount.trim() || '0',
      });
      if (!response.success) {
        toast({ title: response.message ?? 'Could not add prize', variant: 'destructive' });
        return;
      }
      setPrizeLabel('');
      setPrizeAmount('');
      await load();
      toast({ title: 'Prize added' });
    } finally {
      setBusy(false);
    }
  };

  const advanceStage = async (stage: TalentHuntStage) => {
    if (!talentHunt) return;
    setBusy(true);
    try {
      const response = await runTalentHuntAdvancement(talentHunt.id, stage.id);
      if (!response.success) {
        toast({ title: response.message ?? 'Advancement failed', variant: 'destructive' });
        return;
      }
      await load();
      toast({
        title: 'Advancement complete',
        description: response.data
          ? `${response.data.advanced} of ${response.data.total} students advanced.`
          : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex justify-center py-10 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!talentHunt) {
    return (
      <Card className="border-pink-200 bg-pink-50/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#0D1B35]">
            <Trophy className="h-5 w-5 text-pink-600" />
            Talent hunt
          </CardTitle>
          <CardDescription>
            Multi-stage competition linked to this exam. Create the hunt config, then add stages and prizes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void createHunt()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create talent hunt
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stages = talentHunt.stages ?? [];
  const prizes = talentHunt.prizes ?? [];

  return (
    <Card className="border-pink-200 bg-pink-50/30 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#0D1B35]">
              <Trophy className="h-5 w-5 text-pink-600" />
              {talentHunt.title}
            </CardTitle>
            <CardDescription>Stages, advancement rules, and prize tiers for this talent hunt exam.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[talentHunt.status] ?? 'bg-slate-100 text-slate-700'}>
              {talentHunt.status}
            </Badge>
            {talentHunt.status === 'DRAFT' ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void activateHunt()}>
                Activate
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Stages</p>
          {stages.length ? (
            <ul className="mt-2 space-y-2">
              {stages.map((stage) => (
                <li key={stage.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {stage.stageNumber}. {stage.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Cutoff {stage.cutoffScore} · Top {stage.topNAdvance}
                      {stage.linkedExamId ? ` · Linked exam ${stage.linkedExamId.slice(0, 8)}…` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[stage.status] ?? 'bg-slate-100 text-slate-600'}>
                      {stage.status}
                    </Badge>
                    {stage.linkedExamId ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void advanceStage(stage)}>
                        Run advancement
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No stages yet.</p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Stage name" value={stageName} onChange={(e) => setStageName(e.target.value)} />
            <Input placeholder="Linked exam ID (optional)" value={linkedExamId} onChange={(e) => setLinkedExamId(e.target.value)} />
            <Input placeholder="Cutoff score" type="number" value={cutoffScore} onChange={(e) => setCutoffScore(e.target.value)} />
            <Input placeholder="Top N advance" type="number" value={topNAdvance} onChange={(e) => setTopNAdvance(e.target.value)} />
          </div>
          <Button className="mt-2" size="sm" variant="outline" disabled={busy || !stageName.trim()} onClick={() => void addStage()}>
            <Plus className="mr-2 h-4 w-4" />
            Add stage
          </Button>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Prizes</p>
          {prizes.length ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {prizes.map((prize: TalentHuntPrize) => (
                <li key={prize.id} className="rounded-md border border-slate-100 bg-white px-3 py-2">
                  Ranks {prize.rankFrom}–{prize.rankTo}: {prize.label}
                  {prize.amount ? ` (${prize.amount})` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No prizes configured.</p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Prize label" value={prizeLabel} onChange={(e) => setPrizeLabel(e.target.value)} />
            <Input placeholder="Rank from" type="number" value={prizeRankFrom} onChange={(e) => setPrizeRankFrom(e.target.value)} />
            <Input placeholder="Rank to" type="number" value={prizeRankTo} onChange={(e) => setPrizeRankTo(e.target.value)} />
            <Input placeholder="Amount" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} />
          </div>
          <Button className="mt-2" size="sm" variant="outline" disabled={busy || !prizeLabel.trim()} onClick={() => void addPrize()}>
            <Plus className="mr-2 h-4 w-4" />
            Add prize
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
