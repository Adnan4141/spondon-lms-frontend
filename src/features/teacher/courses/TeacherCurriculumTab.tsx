'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { getCurriculumTree } from '@/lib/api/curriculum';
import type { CurriculumTreeNode } from '@/features/admin/curriculum/curriculum-types';
import { cn } from '@/lib/utils';

function CurriculumTreeList({
  nodes,
  depth = 0,
}: {
  nodes: CurriculumTreeNode[];
  depth?: number;
}) {
  if (nodes.length === 0) return null;

  return (
    <ul className={cn('space-y-2', depth > 0 && 'ml-4 border-l border-slate-100 pl-4')}>
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{node.title}</p>
                {node.description ? (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{node.description}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{node.type}</span>
                  {node.estimatedClasses != null ? <span>{node.estimatedClasses} classes</span> : null}
                  {node.durationMinutes != null ? <span>{node.durationMinutes} min</span> : null}
                </div>
              </div>
              {node.children?.length ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              ) : null}
            </div>
          </div>
          {node.children?.length ? (
            <div className="mt-2">
              <CurriculumTreeList nodes={node.children} depth={depth + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function TeacherCurriculumTab({ courseId }: { courseId: string }) {
  const [tree, setTree] = useState<CurriculumTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCurriculumTree(courseId);
        if (cancelled) return;
        if (res.success && res.data?.tree) {
          setTree(res.data.tree as CurriculumTreeNode[]);
        } else {
          setTree([]);
          setError(res.message ?? 'Could not load curriculum.');
        }
      } catch (err) {
        if (!cancelled) {
          setTree([]);
          setError(err instanceof Error ? err.message : 'Could not load curriculum.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-bold text-slate-700">No curriculum published yet</p>
        <p className="mt-1 text-sm text-slate-500">Subjects and lessons will appear here when configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Course structure — subjects, chapters, and lessons as students see them.
      </p>
      <CurriculumTreeList nodes={tree} />
    </div>
  );
}
