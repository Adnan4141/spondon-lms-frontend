'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { OmrScanReviewPanel as OmrScanReviewPanelType } from './OmrScanReviewPanel';

function OmrPanelSkeleton() {
  return (
    <div className="min-h-[320px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
  );
}

export const LazyOmrScanReviewPanel = dynamic(
  () => import('./OmrScanReviewPanel').then((mod) => mod.OmrScanReviewPanel),
  { ssr: false, loading: () => <OmrPanelSkeleton /> },
) as React.ComponentType<ComponentProps<typeof OmrScanReviewPanelType>>;
