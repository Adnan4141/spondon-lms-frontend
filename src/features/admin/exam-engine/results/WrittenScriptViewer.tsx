'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { evalAccent } from './evaluationUi';

export type ScriptPageOption = {
  key: string;
  label: string;
  url: string;
};

type WrittenScriptViewerProps = {
  pageOptions: ScriptPageOption[];
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
  pageOptions,
  activePreviewUrl,
  onPreviewUrlChange,
  compact = false,
  fillHeight = false,
}: WrittenScriptViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const activeIndex = pageOptions.findIndex((page) => page.url === activePreviewUrl);
  const activeLabel = activeIndex >= 0 ? pageOptions[activeIndex]?.label : 'Page';

  const goToPage = useCallback((offset: number) => {
    if (!pageOptions.length || activeIndex < 0) return;
    const nextIndex = activeIndex + offset;
    if (nextIndex < 0 || nextIndex >= pageOptions.length) return;
    onPreviewUrlChange(pageOptions[nextIndex].url);
  }, [activeIndex, onPreviewUrlChange, pageOptions]);

  useEffect(() => {
    setZoom(100);
  }, [activePreviewUrl]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!activePreviewUrl || !pageOptions.length) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPage(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToPage(1);
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
  }, [activePreviewUrl, fullscreenOpen, goToPage, pageOptions.length]);

  if (!pageOptions.length || !activePreviewUrl) {
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
          disabled={activeIndex <= 0}
          onClick={() => goToPage(-1)}
          title="Previous page (←)"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-28 text-center text-xs font-bold text-slate-600">
          {activeIndex + 1} / {pageOptions.length}
        </span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={activeIndex >= pageOptions.length - 1}
          onClick={() => goToPage(1)}
          title="Next page (→)"
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
        <div className="shrink-0 space-y-2 border-b border-slate-100 bg-slate-50/60 p-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handwritten pages</p>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {pageOptions.map((page) => (
              <button
                key={page.key}
                type="button"
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors',
                  activePreviewUrl === page.url
                    ? evalAccent.pillActive
                    : evalAccent.pill,
                )}
                onClick={() => onPreviewUrlChange(page.url)}
              >
                {page.label}
              </button>
            ))}
          </div>
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
