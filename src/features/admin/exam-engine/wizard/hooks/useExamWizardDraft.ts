import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getActorUserIdFromStorage } from '@/lib/actor-user';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import {
  deserializeWizardForm,
  draftStorageKey,
  serializeWizardForm,
} from '../wizardHelpers';

interface Options {
  examId?: string;
  state: ExamWizardState;
  step: number;
  dispatch: React.Dispatch<WizardFormAction>;
  /** When provided, hydration also pushes the saved step into the URL. */
  onHydratedStep?: (savedStep: number) => void;
}

/**
 * Persist the new-exam wizard to localStorage and rehydrate on mount.
 *
 * Drafts are keyed by `<userId>:<examId|new>` so concurrent admins don't
 * trample each other's work-in-progress.
 */
export function useExamWizardDraft({ examId, state, step, dispatch, onHydratedStep }: Options) {
  const userId = useMemo(() => getActorUserIdFromStorage() ?? 'anon', []);
  const storageKey = useMemo(() => draftStorageKey(examId, `${userId}:new`), [examId, userId]);
  const hydratedRef = useRef(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (examId || hydratedRef.current) return;
    hydratedRef.current = true;
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const draft = deserializeWizardForm(raw);
    if (!draft) return;
    const { step: savedStep, ...rest } = draft;
    dispatch({ type: 'MERGE', patch: rest });
    setHasRestoredDraft(true);
    if (onHydratedStep) onHydratedStep(savedStep);
  }, [dispatch, examId, onHydratedStep, storageKey]);

  useEffect(() => {
    if (examId) return;
    if (typeof window === 'undefined') return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, serializeWizardForm({ ...state, step }));
      } catch {
        /* ignore quota */
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [examId, state, step, storageKey]);

  return {
    clearDraft,
    hasRestoredDraft,
    dismissRestoredDraftBanner: () => setHasRestoredDraft(false),
  };
}
