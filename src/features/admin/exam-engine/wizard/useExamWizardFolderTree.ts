import { useEffect, useMemo, useState } from 'react';
import {
  getMergedFolderTree,
  getQuestionFolderTree,
  type FolderTreeNode,
  type MergedFolderTreeResponse,
} from '@/lib/api/question-bank';

type FetchState = {
  key: string;
  trees: MergedFolderTreeResponse['trees'];
  loading: boolean;
  fallbackAll: boolean;
};

const EMPTY_TREES: MergedFolderTreeResponse['trees'] = [];

/**
 * Loads the folder tree for every course linked to the current exam.
 *
 * When the wizard's linked courses produce zero folders, falls back to the
 * legacy single-call "all folders" endpoint and surfaces `fallbackAll` so
 * the UI can render a warning banner.
 *
 * Consumers get:
 *  - `trees` — per-course grouped roots (for the new Step 3 group headers).
 *  - `tree`  — a flat `FolderTreeNode[]` (concat of all roots) so callers
 *              that only care about a single merged tree keep working.
 */
export function useExamWizardFolderTree(courseIds: string[], step: number, minStep = 3) {
  const courseIdsKey = useMemo(() => [...courseIds].sort().join('|'), [courseIds]);
  const [fetchState, setFetchState] = useState<FetchState>({
    key: '',
    trees: EMPTY_TREES,
    loading: false,
    fallbackAll: false,
  });

  const inRange = Boolean(courseIds.length > 0 && step >= minStep);

  useEffect(() => {
    if (!inRange) return;
    const key = courseIdsKey;
    const ac = new AbortController();
    const tid = window.setTimeout(() => {
      setFetchState({ key, trees: EMPTY_TREES, loading: true, fallbackAll: false });
    }, 0);

    getMergedFolderTree(courseIds, undefined, { signal: ac.signal })
      .then(async (r) => {
        if (ac.signal.aborted) return;

        const trees = r.success && r.data?.trees ? r.data.trees : [];
        const hasAnyFolders = trees.some((entry) => entry.roots.length > 0);
        if (hasAnyFolders) {
          setFetchState({ key, trees, loading: false, fallbackAll: false });
          return;
        }

        // Legacy fallback: courses have no folders linked, so show every
        // folder admin-side. Mirrors the previous single-course behaviour.
        const fallback = await getQuestionFolderTree(undefined, undefined, { signal: ac.signal });
        if (ac.signal.aborted) return;
        setFetchState({
          key,
          trees:
            fallback.success && fallback.data
              ? [{ courseId: '', courseName: null, roots: fallback.data }]
              : [],
          loading: false,
          fallbackAll: true,
        });
      })
      .catch((e) => {
        if (ac.signal.aborted || (e as Error)?.name === 'AbortError') return;
        setFetchState({ key, trees: EMPTY_TREES, loading: false, fallbackAll: false });
      });

    return () => {
      window.clearTimeout(tid);
      ac.abort();
    };
  }, [courseIds, courseIdsKey, step, minStep, inRange]);

  const { trees, tree, loading, fallbackAll } = useMemo(() => {
    if (!inRange) {
      return { trees: EMPTY_TREES, tree: [] as FolderTreeNode[], loading: false, fallbackAll: false };
    }
    if (fetchState.key !== courseIdsKey) {
      return { trees: EMPTY_TREES, tree: [] as FolderTreeNode[], loading: true, fallbackAll: false };
    }
    const flat = fetchState.trees.flatMap((entry) => entry.roots);
    return {
      trees: fetchState.trees,
      tree: flat,
      loading: fetchState.loading,
      fallbackAll: fetchState.fallbackAll,
    };
  }, [inRange, courseIdsKey, fetchState]);

  return { trees, tree, loading, fallbackAll };
}
