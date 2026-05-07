import { useEffect, useMemo, useState } from 'react';
import { getQuestionFolderTree, type FolderTreeNode } from '@/lib/api/question-bank';

type FetchState = { courseId: string; nodes: FolderTreeNode[]; loading: boolean; fallbackAll: boolean };

/**
 * Loads folder tree when `courseId` is set and `step >= minStep`, cancelling stale requests if `courseId` changes.
 */
export function useExamWizardFolderTree(courseId: string, step: number, minStep = 3) {
  const [fetchState, setFetchState] = useState<FetchState>({
    courseId: '',
    nodes: [],
    loading: false,
    fallbackAll: false,
  });

  const inRange = Boolean(courseId && step >= minStep);

  useEffect(() => {
    if (!inRange) return;
    const c = courseId;
    const ac = new AbortController();
    const tid = window.setTimeout(() => {
      setFetchState({ courseId: c, nodes: [], loading: true, fallbackAll: false });
    }, 0);
    getQuestionFolderTree(c, undefined, { signal: ac.signal })
      .then(async (r) => {
        if (ac.signal.aborted) return;
        if (r.success && (!r.data || r.data.length === 0)) {
          const fallback = await getQuestionFolderTree(undefined, undefined, { signal: ac.signal });
          if (ac.signal.aborted) return;
          setFetchState({
            courseId: c,
            nodes: fallback.success && fallback.data ? fallback.data : [],
            loading: false,
            fallbackAll: true,
          });
          return;
        }
        setFetchState({
          courseId: c,
          nodes: r.success && r.data ? r.data : [],
          loading: false,
          fallbackAll: false,
        });
      })
      .catch((e) => {
        if (ac.signal.aborted || (e as Error)?.name === 'AbortError') return;
        setFetchState({ courseId: c, nodes: [], loading: false, fallbackAll: false });
      });
    return () => {
      window.clearTimeout(tid);
      ac.abort();
    };
  }, [courseId, step, minStep, inRange]);

  const { tree, loading, fallbackAll } = useMemo(() => {
    if (!inRange) return { tree: [] as FolderTreeNode[], loading: false, fallbackAll: false };
    if (fetchState.courseId !== courseId) return { tree: [] as FolderTreeNode[], loading: true, fallbackAll: false };
    return { tree: fetchState.nodes, loading: fetchState.loading, fallbackAll: fetchState.fallbackAll };
  }, [inRange, courseId, fetchState]);

  return { tree, loading, fallbackAll };
}
