import { useEffect, useMemo, useState } from 'react';
import { getQuestionFolderTree, type FolderTreeNode } from '@/lib/api/question-bank';

type FetchState = { courseId: string; nodes: FolderTreeNode[]; loading: boolean };

/**
 * Loads folder tree when `courseId` is set and `step >= minStep`, cancelling stale requests if `courseId` changes.
 */
export function useExamWizardFolderTree(courseId: string, step: number, minStep = 3) {
  const [fetchState, setFetchState] = useState<FetchState>({
    courseId: '',
    nodes: [],
    loading: false,
  });

  const inRange = Boolean(courseId && step >= minStep);

  useEffect(() => {
    if (!inRange) return;
    const c = courseId;
    const ac = new AbortController();
    const tid = window.setTimeout(() => {
      setFetchState({ courseId: c, nodes: [], loading: true });
    }, 0);
    getQuestionFolderTree(c, undefined, { signal: ac.signal })
      .then((r) => {
        if (ac.signal.aborted) return;
        setFetchState({
          courseId: c,
          nodes: r.success && r.data ? r.data : [],
          loading: false,
        });
      })
      .catch((e) => {
        if (ac.signal.aborted || (e as Error)?.name === 'AbortError') return;
        setFetchState({ courseId: c, nodes: [], loading: false });
      });
    return () => {
      window.clearTimeout(tid);
      ac.abort();
    };
  }, [courseId, step, minStep, inRange]);

  const { tree, loading } = useMemo(() => {
    if (!inRange) return { tree: [] as FolderTreeNode[], loading: false };
    if (fetchState.courseId !== courseId) return { tree: [] as FolderTreeNode[], loading: true };
    return { tree: fetchState.nodes, loading: fetchState.loading };
  }, [inRange, courseId, fetchState]);

  return { tree, loading };
}
