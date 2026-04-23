'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { updateExam } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';

const NAVY = '#1e3a5f';

type ToggleRow = {
  key: string;
  label: string;
  desc: string;
  topLevel?: boolean; // if true, it's a direct Exam field; otherwise it's inside settings JSON
};

const TOGGLE_ROWS: ToggleRow[] = [
  {
    key: 'showLeaderboard',
    label: 'Show Leaderboard',
    desc: 'Students can see the ranked leaderboard after submitting.',
    topLevel: true,
  },
  {
    key: 'showPercentile',
    label: 'Show Percentile',
    desc: 'Display percentile rank alongside marks.',
    topLevel: true,
  },
  {
    key: 'hideResult',
    label: 'Hide Results from Students',
    desc: 'Students cannot see their score until you reveal it.',
  },
  {
    key: 'autoClose',
    label: 'Auto-close on Duration End',
    desc: 'Automatically submits the paper when time expires.',
  },
  {
    key: 'allowRetake',
    label: 'Allow Retake',
    desc: 'Students can attempt the exam more than once.',
  },
  {
    key: 'antiCheat',
    label: 'Anti-cheat Mode',
    desc: 'Logs tab switches and copy attempts.',
  },
];

function getVal(exam: Exam, row: ToggleRow): boolean {
  if (row.topLevel) return !!(exam as any)[row.key];
  return !!((exam.settings as any)?.[row.key]);
}

export function SettingsTab({
  exam,
  onExamChange,
}: {
  exam: Exam;
  onExamChange: (exam: Exam) => void;
}) {
  const { toast } = useToast();

  const [localExam, setLocalExam]     = useState<Exam>(exam);
  const [savingKey, setSavingKey]     = useState<string | null>(null);
  const [omrQ, setOmrQ]               = useState(exam.omrQuestionCount ?? 100);
  const [omrO, setOmrO]               = useState(exam.omrOptionCount   ?? 4);
  const [savingOmr, setSavingOmr]     = useState(false);

  const isOMR = exam.examEngine === 'OMR_BOOK';

  const handleToggle = async (row: ToggleRow) => {
    const cur = getVal(localExam, row);
    const next = !cur;

    let payload: Partial<Exam>;
    if (row.topLevel) {
      payload = { [row.key]: next } as Partial<Exam>;
    } else {
      payload = {
        settings: {
          ...((localExam.settings as object) ?? {}),
          [row.key]: next,
        },
      };
    }

    setSavingKey(row.key);
    const res = await updateExam(localExam.id, payload);
    setSavingKey(null);

    if (res.success && res.data) {
      setLocalExam(res.data);
      onExamChange(res.data);
      toast({ description: 'Setting saved.' });
    } else {
      toast({ description: 'Failed to save setting.', variant: 'destructive' });
    }
  };

  const handleSaveOmr = async () => {
    setSavingOmr(true);
    const res = await updateExam(localExam.id, {
      omrQuestionCount: omrQ,
      omrOptionCount: omrO,
    });
    setSavingOmr(false);
    if (res.success && res.data) {
      setLocalExam(res.data);
      onExamChange(res.data);
      toast({ description: 'OMR settings saved.' });
    } else {
      toast({ description: 'Failed to save OMR settings.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Toggle settings ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-800">Exam Behaviour</p>
          <p className="text-xs text-slate-400 mt-0.5">Toggle features for this exam</p>
        </div>

        <div className="divide-y divide-slate-50">
          {TOGGLE_ROWS.map(row => {
            const enabled = getVal(localExam, row);
            const isSaving = savingKey === row.key;

            return (
              <div key={row.key} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{row.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{row.desc}</p>
                </div>

                <button
                  onClick={() => handleToggle(row)}
                  disabled={isSaving}
                  className={cn(
                    'relative w-11 h-6 rounded-full border-2 transition-all shrink-0 mt-0.5',
                    enabled
                      ? 'bg-slate-900 border-slate-900'
                      : 'bg-slate-100 border-slate-200',
                    isSaving && 'opacity-60',
                  )}
                  aria-checked={enabled}
                  role="switch"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                  ) : (
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm',
                        enabled ? 'left-5' : 'left-0.5',
                      )}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── OMR Settings ── */}
      {isOMR && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-bold text-slate-800">OMR Configuration</p>
            <p className="text-xs text-slate-400 mt-0.5">Set bubble sheet dimensions for this exam</p>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Questions</label>
                <input
                  type="number"
                  min={1} max={500}
                  value={omrQ}
                  onChange={e => setOmrQ(Math.max(1, +e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:border-slate-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Options per Q</label>
                <input
                  type="number"
                  min={2} max={10}
                  value={omrO}
                  onChange={e => setOmrO(Math.max(2, +e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:border-slate-400 outline-none"
                />
              </div>
            </div>

            <Button
              size="sm"
              className="text-white gap-1.5"
              style={{ background: NAVY }}
              disabled={savingOmr}
              onClick={handleSaveOmr}
            >
              {savingOmr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save OMR Settings
            </Button>
          </div>
        </div>
      )}

      {/* ── Danger zone ── */}
      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-rose-50">
          <p className="font-bold text-rose-800">Exam Information</p>
          <p className="text-xs text-rose-400 mt-0.5">Read-only metadata about this exam</p>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          {[
            { label: 'Engine',       value: exam.examEngine ?? '—'          },
            { label: 'Mode',         value: exam.mode ?? '—'                },
            { label: 'Status',       value: exam.status ?? '—'              },
            { label: 'Duration',     value: exam.durationMinutes ? `${exam.durationMinutes} min` : '—' },
            { label: 'Total Sets',   value: exam.totalSets ?? exam.sets?.length ?? '—' },
            { label: 'Exam ID',      value: exam.id                         },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
