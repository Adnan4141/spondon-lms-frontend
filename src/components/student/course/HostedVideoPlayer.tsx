'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const WATERMARK_KEYFRAMES = `
  @keyframes watermarkDrift {
    0%   { top: 6%;  left: 4%;  transform: translate(0, 0); }
    18%  { top: 6%;  left: 96%; transform: translate(-100%, 0); }
    34%  { top: 50%; left: 84%; transform: translate(-100%, -50%); }
    50%  { top: 92%; left: 96%; transform: translate(-100%, -100%); }
    66%  { top: 92%; left: 4%;  transform: translate(0, -100%); }
    82%  { top: 50%; left: 8%;  transform: translate(0, -50%); }
    100% { top: 6%;  left: 4%;  transform: translate(0, 0); }
  }
`;

export interface HostedVideoPlayerProps {
  src: string;
  contentId: string;
  studentPhone?: string | null;
  studentName?: string | null;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
  videoRef?: React.Ref<HTMLVideoElement>;
}

export function HostedVideoPlayer({
  src,
  contentId,
  studentPhone,
  studentName,
  onTimeUpdate,
  onEnded,
  videoRef,
}: HostedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const watermarkText = [studentName, studentPhone].filter(Boolean).join(' | ');

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by browser policy.
    }
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <>
      <style>{WATERMARK_KEYFRAMES}</style>
      <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-900">
        <video
          ref={videoRef}
          key={contentId}
          src={src}
          controls
          controlsList="nofullscreen"
          className="w-full h-full"
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
        />
        <button
          type="button"
          onClick={() => {
            toggleFullscreen();
          }}
          className="absolute bottom-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/75 text-slate-100 backdrop-blur-sm transition hover:bg-slate-800"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        {watermarkText && (
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
            <div
              className="absolute"
              style={{
                animation: 'watermarkDrift 42s linear infinite',
                willChange: 'top, left, transform',
              }}
            >
              <span
                className="block whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white"
                style={{
                  opacity: 0.35,
                  textShadow: '0 1px 4px rgba(0,0,0,0.85)',
                }}
              >
                {watermarkText}
              </span>
            </div>
            <span
              className="absolute bottom-[8%] right-[4%] block whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white"
              style={{
                opacity: 0.15,
                textShadow: '0 1px 4px rgba(0,0,0,0.85)',
              }}
            >
              {watermarkText}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
