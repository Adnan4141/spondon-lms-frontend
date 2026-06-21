'use client';

import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type WrittenUploadLightboxProps = {
  url: string | null;
  label?: string;
  onClose: () => void;
};

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

export function WrittenUploadLightbox({ url, label, onClose }: WrittenUploadLightboxProps) {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setZoom(100);
  }, [url]);

  useEffect(() => {
    if (!url) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, url]);

  if (!url) return null;

  const scale = zoom / 100;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <p className="truncate text-sm font-bold">{label ?? 'Uploaded page'}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => setZoom((current) => Math.max(50, current - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs font-bold">{zoom}%</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => setZoom((current) => Math.min(250, current + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4">
        {isPdfUrl(url) ? (
          <iframe
            title={label ?? 'Uploaded page'}
            src={url}
            className="w-full max-w-5xl bg-white"
            style={{ height: `${Math.round(720 * scale)}px`, minHeight: '480px' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label ?? 'Uploaded page'}
            className={cn('max-w-full object-contain transition-transform duration-150')}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          />
        )}
      </div>
    </div>
  );
}
