'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileStack, ImageIcon, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { evalAccent } from './evaluationUi';
import type { ScriptQuestionGroup } from './writtenEvaluationUtils';
import {
  findScriptGroupByUrl,
  getDefaultScriptPreviewUrl,
  getQuestionScriptPreviewUrl,
} from './writtenEvaluationUtils';

type ScriptViewOption = {
  key: string;
  label: string;
  shortLabel: string;
  url: string;
  kind: 'combined' | 'page';
};

type WrittenScriptViewerProps = {
  questionGroups: ScriptQuestionGroup[];
  activePreviewUrl: string | null;
  onPreviewUrlChange: (url: string) => void;
  compact?: boolean;
  /** Stretch to fill parent flex column (evaluation desk layout). */
  fillHeight?: boolean;
};

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 250];

function nextZoom(current: number, direction: 'in' | 'out'): number {
  if (direction === 'in') {
    return ZOOM_STEPS.find((step) => step > current) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  }
  return [...ZOOM_STEPS].reverse().find((step) => step < current) ?? ZOOM_STEPS[0];
}

function buildViewOptions(group: ScriptQuestionGroup): ScriptViewOption[] {
  const options: ScriptViewOption[] = [];
  if (group.combinedPdfUrl) {
    options.push({
      key: `${group.questionId}-combined`,
      label: `Q${group.questionNo} · Combined PDF`,
      shortLabel: 'Combined',
      url: group.combinedPdfUrl,
      kind: 'combined',
    });
  }
  for (const page of group.pages) {
    options.push({
      key: `${group.questionId}-page-${page.pageNo}`,
      label: `Q${group.questionNo} · Page ${page.pageNo}`,
      shortLabel: `Page ${page.pageNo}`,
      url: page.url,
      kind: 'page',
    });
  }
  return options;
}

function ScriptPreview({
  url,
  zoom,
  className,
  fillHeight = false,
}: {
  url: string;
  zoom: number;
  className?: string;
  fillHeight?: boolean;
}) {
  const scale = zoom / 100;
  const previewHeight = fillHeight ? '100%' : `${Math.round(560 * scale)}px`;

  if (isPdfUrl(url)) {
    return (
      <div className={cn('overflow-auto bg-slate-100', fillHeight && 'h-full', className)}>
        <iframe
          title="Handwritten submission preview"
          src={url}
          className="w-full bg-white"
          style={{
            height: previewHeight,
            minHeight: fillHeight ? '280px' : '320px',
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto bg-slate-100', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Handwritten submission page"
        className="mx-auto block origin-top transition-transform duration-150"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      />
    </div>
  );
}

export function WrittenScriptViewer({
  questionGroups,
  activePreviewUrl,
  onPreviewUrlChange,
  compact = false,
  fillHeight = false,
}: WrittenScriptViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const activeGroup = useMemo(
    () => findScriptGroupByUrl(questionGroups, activePreviewUrl),
    [activePreviewUrl, questionGroups],
  );

  const viewOptions = useMemo(
    () => (activeGroup ? buildViewOptions(activeGroup) : []),
    [activeGroup],
  );

  const activeViewIndex = viewOptions.findIndex((option) => option.url === activePreviewUrl);
  const activeView = activeViewIndex >= 0 ? viewOptions[activeViewIndex] : viewOptions[0] ?? null;
  const activeLabel = activeView?.label ?? 'Script preview';

  const selectQuestion = useCallback((group: ScriptQuestionGroup) => {
    const url = getQuestionScriptPreviewUrl(group);
    if (url) onPreviewUrlChange(url);
  }, [onPreviewUrlChange]);

  const goToView = useCallback((offset: number) => {
    if (!viewOptions.length || activeViewIndex < 0) return;
    const nextIndex = activeViewIndex + offset;
    if (nextIndex < 0 || nextIndex >= viewOptions.length) return;
    onPreviewUrlChange(viewOptions[nextIndex].url);
  }, [activeViewIndex, onPreviewUrlChange, viewOptions]);

  useEffect(() => {
    if (!questionGroups.length) return;
    const resolved = activePreviewUrl ?? getDefaultScriptPreviewUrl(questionGroups);
    if (!resolved) return;
    const known = findScriptGroupByUrl(questionGroups, resolved);
    if (!known) {
      onPreviewUrlChange(getDefaultScriptPreviewUrl(questionGroups)!);
    }
  }, [activePreviewUrl, onPreviewUrlChange, questionGroups]);

  useEffect(() => {
    setZoom(100);
  }, [activePreviewUrl]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!activePreviewUrl || !viewOptions.length) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToView(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToView(1);
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        setFullscreenOpen(true);
      } else if (event.key === 'Escape' && fullscreenOpen) {
        setFullscreenOpen(false);
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom((current) => nextZoom(current, 'in'));
      } else if (event.key === '-') {
        event.preventDefault();
        setZoom((current) => nextZoom(current, 'out'));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activePreviewUrl, fullscreenOpen, goToView, viewOptions.length]);

  if (!questionGroups.length || !activePreviewUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500',
          fillHeight ? 'h-full min-h-48' : 'min-h-48',
        )}
      >
        No handwritten pages to preview.
      </div>
    );
  }

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={activeViewIndex <= 0}
          onClick={() => goToView(-1)}
          title="Previous view (←)"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-32 text-center text-xs font-bold text-slate-600">
          {activeView
            ? activeView.kind === 'combined'
              ? 'Combined PDF'
              : `${activeView.shortLabel} of ${activeGroup?.pages.length ?? viewOptions.length}`
            : '—'}
        </span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={activeViewIndex >= viewOptions.length - 1}
          onClick={() => goToView(1)}
          title="Next view (→)"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => setZoom((current) => nextZoom(current, 'out'))}
          title="Zoom out (-)"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs font-black text-slate-700">{zoom}%</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => setZoom((current) => nextZoom(current, 'in'))}
          title="Zoom in (+)"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => setZoom(100)}
          title="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => setFullscreenOpen(true)}
          title="Fullscreen (F)"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white',
          fillHeight && 'h-full min-h-0',
        )}
      >
        <div className="shrink-0 space-y-2.5 border-b border-slate-100 bg-slate-50/60 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Script viewer</p>
            {activeGroup ? (
              <p className="text-[11px] font-semibold text-[#7A6035]">
                Question {activeGroup.questionNo}
              </p>
            ) : null}
          </div>

          {questionGroups.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {questionGroups.map((group) => {
                const isActive = activeGroup?.questionId === group.questionId;
                const hasCombined = Boolean(group.combinedPdfUrl);
                return (
                  <button
                    key={group.questionId}
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                      isActive ? evalAccent.pillActive : evalAccent.pill,
                    )}
                    onClick={() => selectQuestion(group)}
                  >
                    Q{group.questionNo}
                    {hasCombined ? (
                      <FileStack className="h-3 w-3 opacity-80" />
                    ) : (
                      <ImageIcon className="h-3 w-3 opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}

          {viewOptions.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">View mode</p>
              <div className="flex flex-wrap gap-1.5">
                {viewOptions.map((option) => {
                  const isActive = activePreviewUrl === option.url;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors',
                        isActive
                          ? option.kind === 'combined'
                            ? 'bg-[#0D1B35] text-[#E2C98A] shadow-sm'
                            : evalAccent.pillActive
                          : option.kind === 'combined'
                            ? 'border border-[#C8A96E]/40 bg-[#FBF4E6] text-[#7A6035] hover:bg-[#F5EBD6]'
                            : evalAccent.pill,
                      )}
                      onClick={() => onPreviewUrlChange(option.url)}
                    >
                      {option.kind === 'combined' ? (
                        <FileStack className="h-3 w-3 shrink-0" />
                      ) : (
                        <ImageIcon className="h-3 w-3 shrink-0" />
                      )}
                      {option.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {toolbar}
        </div>

        <ScriptPreview
          url={activePreviewUrl}
          zoom={zoom}
          fillHeight={fillHeight}
          className={cn(
            'min-h-0 flex-1 rounded-b-lg',
            fillHeight
              ? 'max-h-none'
              : compact
                ? 'max-h-[min(420px,50vh)]'
                : 'max-h-[min(720px,75vh)]',
          )}
        />
      </div>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent
          className="flex h-[95vh] max-h-[95vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]"
          showCloseButton
        >
          <DialogHeader className="border-b border-slate-100 px-4 py-3 text-left">
            <DialogTitle className="text-sm font-bold text-slate-900">{activeLabel}</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            {toolbar}
            <ScriptPreview url={activePreviewUrl} zoom={zoom} className="min-h-0 flex-1 rounded-lg border border-slate-200" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
