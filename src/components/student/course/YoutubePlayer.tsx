'use client';



import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FastForward,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Rewind,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toYoutubeNoCookieSrc } from '@/lib/youtube';

// ─── Watermark drift keyframes ─────────────────────────────────────────────
// Defined as a <style> tag because Tailwind @keyframes cannot be added inline.
// The animation moves the watermark label slowly across four waypoints so it
// never settles in one spot and remains readable without becoming distracting.
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

// ─── Props ─────────────────────────────────────────────────────────────────

export interface YoutubePlayerProps {
  /** 11-character YouTube video ID (not the full URL). */
  videoId: string;
  /** Displayed in the pre-play overlay and as the iframe title (accessibility). */
  courseTitle: string;
  /**
   * Enrolled student's phone — shown in the moving watermark.
   * Purpose: social deterrent against sharing. NOT a security boundary.
   */
  studentPhone?: string | null;
  /**
   * Enrolled student's full name — combined with phone in watermark.
   * Makes screen recordings personally identifiable even if phone is masked.
   */
  studentName?: string | null;
  /**
   * Called when the YouTube video ends (playerState === 0).
   * Uses the YouTube IFrame postMessage API — no SDK script tag required.
   */
  onEnded?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function YoutubePlayer({
  videoId,
  courseTitle,
  studentPhone,
  studentName,
  onEnded,
}: YoutubePlayerProps) {
  const [started, setStarted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const hoveringControlsRef = useRef(false);
  const seekingRef = useRef(false);

  function blockContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimerRef.current != null) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideControlsTimer();
    if (!started) return;
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (!hoveringControlsRef.current && !seekingRef.current) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [clearHideControlsTimer, started]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (!hoveringControlsRef.current && !seekingRef.current) {
      scheduleHideControls();
    }
  }, [scheduleHideControls]);

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
      // Fullscreen may be blocked by browser policy or unsupported embed context.
    }
    revealControls();
  }, [revealControls]);

  const sendPlayerCommand = useCallback((func: string, args: unknown[] = []) => {
    if (!started) return;
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube-nocookie.com',
    );
  }, [started]);

  const initializePlayerBridge = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: videoId }),
      'https://www.youtube-nocookie.com',
    );
    sendPlayerCommand('addEventListener', ['onReady']);
    sendPlayerCommand('addEventListener', ['onStateChange']);
    sendPlayerCommand('getDuration');
    sendPlayerCommand('getCurrentTime');
  }, [sendPlayerCommand, videoId]);

  function formatTime(seconds: number) {
    const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function seekTo(nextSeconds: number) {
    const maxTime = duration > 0 ? duration : Math.max(currentTime, nextSeconds, 0);
    const clamped = Math.max(0, Math.min(nextSeconds, maxTime));
    setCurrentTime(clamped);
    sendPlayerCommand('seekTo', [clamped, true]);
  }

  function seekBy(deltaSeconds: number) {
    seekTo(currentTime + deltaSeconds);
  }

  function cyclePlaybackRate() {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.findIndex((rate) => rate === playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    sendPlayerCommand('setPlaybackRate', [nextRate]);
  }

  useEffect(() => {
    if (!started) return;
    scheduleHideControls();
  }, [started, scheduleHideControls]);

  useEffect(() => {
    return () => clearHideControlsTimer();
  }, [clearHideControlsTimer]);

  // ── YouTube IFrame API: detect video ended via postMessage ─────────────
  // YouTube sends {event:'infoDelivery', info:{playerState:0}} when video ends.
  // No SDK script tag needed — raw postMessage listener is sufficient.
  useEffect(() => {
    if (!started) return;
    function handleMessage(event: MessageEvent) {
      if (!event.origin.includes('youtube')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'onReady') {
          setPlayerReady(true);
          sendPlayerCommand('getDuration');
          sendPlayerCommand('getCurrentTime');
          return;
        }

        if (data?.event !== 'infoDelivery') return;

        const state = data?.info?.playerState;
        if (state === 1) setIsPlaying(true);
        if (state === 0 || state === 2) setIsPlaying(false);
        if (state === 0) {
          onEnded?.();
        }

        const nextDuration = Number(data?.info?.duration);
        if (Number.isFinite(nextDuration) && nextDuration > 0) {
          setDuration(nextDuration);
        }

        const nextCurrentTime = Number(data?.info?.currentTime);
        if (!seeking && dragTime == null && Number.isFinite(nextCurrentTime) && nextCurrentTime >= 0) {
          setCurrentTime(nextCurrentTime);
        }
      } catch {
        // Ignore non-JSON messages from other postMessage senders
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [started, onEnded, seeking, dragTime, videoId, sendPlayerCommand]);

  useEffect(() => {
    if (!started || !playerReady) return;
    const interval = window.setInterval(() => {
      sendPlayerCommand('getCurrentTime');
      sendPlayerCommand('getDuration');
    }, 500);
    return () => window.clearInterval(interval);
  }, [started, playerReady, sendPlayerCommand]);

  // ── Tab visibility: pause video when student switches tabs ────────────
  // Prevents background audio and discourages passive multi-tab watching.
  useEffect(() => {
    if (!started) return;
    function handleVisibilityChange() {
      if (document.hidden) {
        sendPlayerCommand('pauseVideo');
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, sendPlayerCommand]);

  // youtube-nocookie.com embed — autoplay=1 triggers after user gesture (button click)
  const src = toYoutubeNoCookieSrc(videoId, /* autoplay */ true);

  // YouTube's own thumbnail CDN — used as blurred background in pre-play overlay.
  // maxresdefault.jpg falls back to a black frame for very old videos; that's fine.
  const thumbnailSrc = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  // Build watermark label: name + phone for stronger personal identification.
  // Both fields are social deterrents — visible in screen recordings.
  const watermarkText = [studentName, studentPhone].filter(Boolean).join(' | ');

  return (
    <>
      {/* Inject @keyframes — only added to DOM once per component mount */}
      <style>{WATERMARK_KEYFRAMES}</style>

      {/*
        Fill parent container (parent is responsible for sizing, e.g. aspect-video).
        overflow-hidden clips the watermark when it drifts beyond the video edges.
        onContextMenu blocks right-click on our overlay layers (cross-origin iframe
        itself cannot be blocked at browser level — this covers our overlay div).
      */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden bg-slate-900"
        onContextMenu={blockContextMenu}
        onContextMenuCapture={blockContextMenu}
        onMouseMove={() => {
          if (!started) return;
          revealControls();
        }}
        onTouchStart={() => {
          if (!started) return;
          revealControls();
        }}
      >
        {!started ? (
          /* ── Pre-play overlay ─────────────────────────────────────────── */
          <button
            type="button"
            aria-label={`পাঠ শুরু করুন: ${courseTitle}`}
            onClick={() => {
              setStarted(true);
              setIsPlaying(true);
            }}
            className={[
              'group absolute inset-0 w-full h-full',
              'flex flex-col items-center justify-center',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset',
            ].join(' ')}
          >
            {/*
              Blurred YouTube thumbnail — gives visual context while hiding
              YouTube's default title bar, channel avatar, and UI chrome.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 opacity-35 pointer-events-none select-none"
            />

            {/* Dark scrim — further conceals YouTube channel branding */}
            <div className="absolute inset-0 bg-slate-900/75 pointer-events-none" />

            {/* Course title above play button */}
            <p className="relative z-10 text-slate-300 text-sm font-medium mb-6 px-8 text-center line-clamp-2 drop-shadow-md max-w-md">
              {courseTitle}
            </p>

            {/* Play circle — primary CTA */}
            <div
              aria-hidden="true"
              className={[
                'relative z-10 flex items-center justify-center',
                'w-20 h-20 rounded-full',
                'bg-indigo-600 shadow-2xl',
                'group-hover:bg-indigo-500 group-hover:scale-105 active:scale-95',
                'transition-all duration-200',
              ].join(' ')}
            >
              <Play className="h-9 w-9 text-white translate-x-0.5" fill="white" />
            </div>

            <p className="relative z-10 text-slate-400 text-sm mt-5 font-semibold tracking-widest uppercase drop-shadow">
              পাঠ শুরু করুন
            </p>
          </button>
        ) : (
          /* ── Active player ───────────────────────────────────────────── */
          <>
            <iframe
              ref={iframeRef}
              key={videoId}
              title={courseTitle}
              src={src}
              className="absolute inset-0 w-full h-full border-0"
              onLoad={() => {
                window.setTimeout(initializePlayerBridge, 50);
              }}
              onContextMenu={blockContextMenu}
              onContextMenuCapture={blockContextMenu}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
            />

            <div className="absolute inset-x-0 bottom-0 z-30 bg-linear-to-t from-slate-950/90 via-slate-900/45 to-transparent px-3 pb-3 pt-10">
              <div
                className={[
                  'flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/65 px-3 py-2 backdrop-blur-sm transition-opacity duration-300',
                  controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
                ].join(' ')}
                onMouseEnter={() => {
                  hoveringControlsRef.current = true;
                  setControlsVisible(true);
                  clearHideControlsTimer();
                }}
                onMouseLeave={() => {
                  hoveringControlsRef.current = false;
                  scheduleHideControls();
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying) {
                      sendPlayerCommand('pauseVideo');
                      setIsPlaying(false);
                    } else {
                      sendPlayerCommand('playVideo');
                      setIsPlaying(true);
                    }
                    revealControls();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-500"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" fill="currentColor" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    seekBy(-10);
                    revealControls();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-slate-100 transition hover:bg-slate-800"
                  aria-label="Rewind 10 seconds"
                >
                  <Rewind className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    seekBy(10);
                    revealControls();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-slate-100 transition hover:bg-slate-800"
                  aria-label="Forward 10 seconds"
                >
                  <FastForward className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    seekTo(0);
                    revealControls();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-slate-100 transition hover:bg-slate-800"
                  aria-label="Restart video"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isMuted) {
                      sendPlayerCommand('unMute');
                      setIsMuted(false);
                    } else {
                      sendPlayerCommand('mute');
                      setIsMuted(true);
                    }
                    revealControls();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-slate-100 transition hover:bg-slate-800"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cyclePlaybackRate();
                    revealControls();
                  }}
                  className="h-9 min-w-12 rounded-full border border-white/15 bg-slate-900/70 px-2 text-xs font-bold text-slate-100 transition hover:bg-slate-800"
                  aria-label="Change playback speed"
                >
                  {playbackRate.toFixed(playbackRate % 1 === 0 ? 0 : 2)}x
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleFullscreen();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-slate-100 transition hover:bg-slate-800"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold text-slate-200">
                  <span className="tabular-nums">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(duration, 1)}
                    step={0.1}
                    value={Math.min(dragTime ?? currentTime, Math.max(duration, 1))}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setSeeking(true);
                      seekingRef.current = true;
                      setDragTime(next);
                      setControlsVisible(true);
                      clearHideControlsTimer();
                    }}
                    onMouseUp={() => {
                      if (dragTime != null) {
                        seekTo(dragTime);
                      }
                      setDragTime(null);
                      setSeeking(false);
                      seekingRef.current = false;
                      revealControls();
                    }}
                    onTouchEnd={() => {
                      if (dragTime != null) {
                        seekTo(dragTime);
                      }
                      setDragTime(null);
                      setSeeking(false);
                      seekingRef.current = false;
                      revealControls();
                    }}
                    onBlur={() => {
                      if (dragTime != null) {
                        seekTo(dragTime);
                      }
                      setDragTime(null);
                      setSeeking(false);
                      seekingRef.current = false;
                      revealControls();
                    }}
                    className="h-1 w-full cursor-pointer accent-indigo-500"
                    aria-label="Seek video"
                  />
                  <span className="tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/*
              Drifting watermark — SOCIAL DETERRENT ONLY.
              Displays the enrolled student's name and phone so that
              screen recordings or screenshots can be traced back to the account.
              This does NOT prevent: DevTools URL inspection, yt-dlp downloads,
              or iframe src extraction. pointer-events-none ensures native video
              controls remain fully clickable through the watermark layer.
            */}
            {watermarkText && (
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
                {/* Drifting watermark — moves continuously across four corners */}
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
                {/* Static second watermark at bottom-right — two simultaneous marks make cropping harder */}
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
          </>
        )}
      </div>
    </>
  );
}
