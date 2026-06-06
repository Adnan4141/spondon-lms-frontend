'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { RichTextEditor as RichTextEditorType } from './rich-text-editor';

function EditorSkeleton() {
  return (
    <div className="min-h-[200px] animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
  );
}

export const LazyRichTextEditor = dynamic(
  () => import('./rich-text-editor').then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
) as React.ComponentType<ComponentProps<typeof RichTextEditorType>>;
