'use client';

/**
 * YoutubePlayer — LMS-style lazy-loading YouTube embed with moving watermark.
 *
 * ── Security limitations (read before modifying) ──────────────────────────────
 *  ✗  The video ID is visible in the iframe src (Network tab / DevTools).
 *  ✗  Unlisted YouTube videos CANNOT be made fully private via embedding alone.
 *  ✗  The watermark does NOT protect against DevTools inspection, copy-pasting
 *     the URL, or tools like yt-dlp.
 *  ✓  youtube-nocookie.com reduces third-party cookies and YouTube tracking.
 *  ✓  Lazy-load (no iframe until "Start Lesson" click) reduces casual URL
 *     discovery and prevents YouTube from loading before user intent.
 *  ✓  The phone watermark is a SOCIAL DETERRENT — it discourages screen recording
 *     and sharing by visibly associating the content with the viewer's phone number.
 *
 * ── YouTube IFrame API (advanced — not implemented here) ──────────────────────
 *  To track watch percentage (like HTML <video> onTimeUpdate):
 *  1. Add to your page/layout:
 *       <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />
 *  2. After Start Lesson, create a YT.Player on the iframe element:
 *       const player = new YT.Player(iframeRef.current!, {
 *         events: {
 *           onStateChange: (e) => {
 *             if (e.data === YT.PlayerState.ENDED) markProgressComplete();
 *           },
 *         },
 *       });
 *  This gives you the same lifecycle hooks as HTML <video> onEnded / onTimeUpdate.
 *
 * ── When to leave YouTube ─────────────────────────────────────────────────────
 *  • Need expiring signed URLs + token-gated HLS  → Bunny Stream / Cloudflare Stream / Mux
 *  • Need DRM (Widevine / FairPlay)               → Mux DRM / Bunny Stream DRM
 *  • Concerned about YouTube ToS (commercial use) → Self-hosted HLS
 *  • Need server-side per-segment access control  → AWS S3 presigned URLs + HLS
 *
 * ── Production security checklist ────────────────────────────────────────────
 *  □ All /student/* routes protected by server-side auth middleware
 *  □ Course content API requires valid JWT — never unauthenticated
 *  □ Enrollment check server-side before returning video IDs
 *  □ Content-Security-Policy frame-src allows youtube-nocookie.com
 *  □ Referrer-Policy: strict-origin-when-cross-origin (default in Next.js)
 *  □ HTTPS enforced — no mixed content
 *  □ YouTube video set to "Unlisted" (not Public) — not a security boundary, but reduces
 *    discoverability for users who don't share the link
 *  □ Rate-limit / audit-log content API calls to detect credential sharing
 *  □ Periodically rotate video IDs if a link is found circulating publicly
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   Parent must provide height — e.g. wrap in <div className="aspect-video">
 *   The component fills its container with position:absolute inset-0.
 */

import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── YouTube IFrame API: detect video ended via postMessage ─────────────
  // YouTube sends {event:'infoDelivery', info:{playerState:0}} when video ends.
  // No SDK script tag needed — raw postMessage listener is sufficient.
  useEffect(() => {
    if (!started || !onEnded) return;
    function handleMessage(event: MessageEvent) {
      if (!event.origin.includes('youtube')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 0) {
          onEnded();
        }
      } catch {
        // Ignore non-JSON messages from other postMessage senders
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [started, onEnded]);

  // ── Tab visibility: pause video when student switches tabs ────────────
  // Prevents background audio and discourages passive multi-tab watching.
  useEffect(() => {
    if (!started) return;
    function handleVisibilityChange() {
      if (document.hidden) {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          'https://www.youtube-nocookie.com',
        );
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started]);

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
        className="relative w-full h-full overflow-hidden bg-slate-900"
        onContextMenu={(e) => e.preventDefault()}
      >
        {!started ? (
          /* ── Pre-play overlay ─────────────────────────────────────────── */
          <button
            type="button"
            aria-label={`পাঠ শুরু করুন: ${courseTitle}`}
            onClick={() => setStarted(true)}
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
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
            />

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
