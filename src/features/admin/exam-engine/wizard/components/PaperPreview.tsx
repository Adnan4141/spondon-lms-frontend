import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ExamWizardState, WizardSection } from '../../types';
import { SEC_TYPES } from '../constants';
import { sectionMcqPassageGoal, setLabelsForPreview } from '../wizardHelpers';

type Props = {
  state: ExamWizardState;
  step: number;
  className?: string;
};

/** Visual summary of paper layout (not a real PDF) — mirrors the prototype’s “premium” preview. */
export function PaperPreview({ state, step, className }: Props) {
  const nSets = Math.min(26, Math.max(1, Number(state.nSets) || 1));
  const setLabels = setLabelsForPreview(state.setNaming, nSets);
  const sections: WizardSection[] =
    state.uiCategory === 'MULTI' || state.uiCategory === 'OMRB' || state.uiCategory === 'OFFLINE_RESULT'
      ? []
      : state.sections;

  const omrish = state.uiCategory === 'OMR' || state.uiCategory === 'OMRB';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border-2 border-[#0D1B35]/20 bg-[#FFFCF5] text-[#0D1B35] shadow-inner',
        className,
      )}
    >
      <div className="border-b border-[#0D1B35]/15 bg-[#0D1B35] px-4 py-3 text-[#E2C98A]">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide">
          <span>Spondon LMS · exam paper</span>
          <span className="opacity-90">Step {step} / 6</span>
        </div>
        <h3 className="mt-1 font-serif text-lg font-normal leading-tight text-[#E2C98A] md:text-xl">
          {state.title.trim() || 'Untitled exam'}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#E2C98A]/90">
          <span>{state.durationMinutes} min</span>
          <span>{state.deliveryMode === 'ONLINE' ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-[1fr_minmax(120px,28%)]">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Question blocks</p>
          {sections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-500">
              {state.uiCategory === 'OFFLINE_RESULT'
                ? 'Offline result-entry workflow: no online paper is required. Use the Results page after teachers mark scripts.'
                : state.uiCategory === 'MULTI'
                ? 'Multi-subject: sections attach after save from the subjects screen.'
                : 'Add sections in step 2 to see the paper outline.'}
            </p>
          ) : (
            sections.map((s, idx) => {
              const t = SEC_TYPES.find((x) => x.id === s.type);
              return (
                <div
                  key={s.localId}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: t?.color ?? '#0D1B35' }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {idx + 1}. {s.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {s.type === 'MCQ' && sectionMcqPassageGoal(s) > 0
                        ? `${s.count} slots · ≤${sectionMcqPassageGoal(s)} passage · ${s.marks}m`
                        : `${s.count} × ${s.marks}m`}
                      {s.neg ? ` · −${s.neg}` : ''}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {t?.label ?? s.type} · {s.difficulty.toLowerCase()} · {s.folderRules.length} folder pool
                    {s.folderRules.length === 1 ? '' : 's'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from({ length: Math.min(s.count, 12) }, (_, i) => (
                      <span
                        key={i}
                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-[9px] font-mono text-slate-600"
                      >
                        {i + 1}
                      </span>
                    ))}
                    {s.count > 12 ? (
                      <span className="self-center text-[9px] text-slate-400">+{s.count - 12}</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sets & OMR</p>
          <div className="flex flex-wrap gap-1">
            {setLabels.map((lbl) => (
              <span
                key={lbl}
                className="rounded border border-[#C8A96E]/60 bg-[#FBF4E6] px-2 py-1 text-[10px] font-bold text-[#5C4300]"
              >
                Set {lbl}
              </span>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-slate-600">
            Shuffle: <span className="font-medium text-slate-800">{state.shuffle}</span>
          </p>
          {omrish ? (
            <div className="mt-2 rounded border border-dashed border-[#1565C0]/40 bg-sky-50/80 p-2">
              <p className="text-[10px] font-semibold text-sky-900">OMR bubble strip (preview)</p>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 20 }, (_, i) => (
                  <span key={i} className="h-3 w-3 rounded-full border border-sky-700/40 bg-white" />
                ))}
              </div>
              <p className="mt-1 text-[9px] text-sky-800/80">Roll / set ID · sync marks to scan pipeline after attempt.</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">Standard online / PDF delivery — no OMR strip.</p>
          )}
        </div>
      </div>
    </div>
  );
}
