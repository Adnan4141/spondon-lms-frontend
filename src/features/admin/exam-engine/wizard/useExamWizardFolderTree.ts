import { useEffect, useMemo, useState } from 'react';
import {
  getQuestionFolderTree,
  type FolderTreeNode,
  type MergedFolderTreeResponse,
} from '@/lib/api/question-bank';

type FetchState = {
  trees: MergedFolderTreeResponse['trees'];
  loading: boolean;
};

const EMPTY_TREES: MergedFolderTreeResponse['trees'] = [];

/**
 * Loads the full question-bank folder tree (all courses).
 * Independent of the exam's audience/content course.
 *
 * Consumers get:
 *  - `trees` — grouped roots (single synthetic group for now).
 *  - `tree`  — flat `FolderTreeNode[]` (concat of all roots).
 */
export function useExamWizardFolderTree(
  step: number,
  minStep = 3,
  teacherUserId?: string,
) {
  const [fetchState, setFetchState] = useState<FetchState>({
    trees: EMPTY_TREES,
    loading: false,
  });

  const inRange = step >= minStep;

  useEffect(() => {
    if (!inRange) return;
    const ac = new AbortController();

    setFetchState({ trees: EMPTY_TREES, loading: true });

    getQuestionFolderTree(undefined, teacherUserId, { signal: ac.signal })
      .then((r) => {
        if (ac.signal.aborted) return;
        setFetchState({
          trees:
            r.success && r.data
              ? [{ courseId: '', courseName: null, roots: r.data }]
              : [],
          loading: false,
        });
      })
      .catch((e) => {
        if (ac.signal.aborted || (e as Error)?.name === 'AbortError') return;
        setFetchState({ trees: EMPTY_TREES, loading: false });
      });

    return () => ac.abort();
  }, [step, minStep, inRange, teacherUserId]);

  return useMemo(() => {
    if (!inRange) {
      return {
        trees: EMPTY_TREES,
        tree: [] as FolderTreeNode[],
        loading: false,
        fallbackAll: false,
      };
    }
    const flat = fetchState.trees.flatMap((entry) => entry.roots);
    return {
      trees: fetchState.trees,
      tree: flat,
      loading: fetchState.loading,
      fallbackAll: false,
    };
  }, [inRange, fetchState]);
}
