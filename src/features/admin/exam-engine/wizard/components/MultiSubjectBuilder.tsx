'use client';

import { useMemo } from 'react';
import { FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { SubjectCard } from './SubjectCard';
import type { MergedFolderTreeResponse } from '@/lib/api/question-bank';
import { buildRollupCountsMap } from '../wizardHelpers';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  /** Per-course grouped folder trees from `useExamWizardFolderTree`. */
  folderTrees?: MergedFolderTreeResponse['trees'];
};

export function MultiSubjectBuilder({ state, dispatch, folderTrees }: Props) {
  // Existing folderIds picked across subjects — used to grey out duplicate shortcut entries.
  const claimedFolderIds = useMemo(() => {
    return new Set(state.subjects.flatMap((s) => s.folderRules.map((r) => r.folderId)));
  }, [state.subjects]);

  const rootSummary = useMemo(() => {
    if (!folderTrees) return [] as Array<{ folderId: string; name: string; total: number; courseName: string | null }>;
    const out: Array<{ folderId: string; name: string; total: number; courseName: string | null }> = [];
    for (const entry of folderTrees) {
      const rollup = buildRollupCountsMap(entry.roots);
      for (const root of entry.roots) {
        out.push({
          folderId: root.id,
          name: root.name,
          total: rollup.get(root.id)?.total ?? 0,
          courseName: entry.courseName,
        });
      }
    }
    return out;
  }, [folderTrees]);

  const addAllRoots = () => {
    dispatch({
      type: 'ADD_SUBJECTS_FROM_FOLDER_ROOTS',
      roots: rootSummary
        .filter((r) => !claimedFolderIds.has(r.folderId))
        .map((r) => ({ folderId: r.folderId, name: r.name, defaultCount: Math.min(25, Math.max(5, r.total || 10)) })),
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Subjects & sections</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Build every subject here, then attach question folders in the next step.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rootSummary.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[#C8A96E]/50 text-[#0D1B35]"
                >
                  <FolderTree className="mr-1.5 h-3.5 w-3.5" />
                  Add from folder roots
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="text-xs">Top-level folders across linked courses</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {rootSummary.map((row) => {
                  const isClaimed = claimedFolderIds.has(row.folderId);
                  return (
                    <DropdownMenuItem
                      key={row.folderId}
                      disabled={isClaimed}
                      onClick={() =>
                        dispatch({
                          type: 'ADD_SUBJECTS_FROM_FOLDER_ROOTS',
                          roots: [
                            {
                              folderId: row.folderId,
                              name: row.name,
                              defaultCount: Math.min(25, Math.max(5, row.total || 10)),
                            },
                          ],
                        })
                      }
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{row.name}</p>
                        {row.courseName ? (
                          <p className="truncate text-[10px] text-slate-400">{row.courseName}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {row.total}Q{isClaimed ? ' · added' : ''}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={addAllRoots}
                  disabled={rootSummary.every((r) => claimedFolderIds.has(r.folderId))}
                >
                  + Add all remaining roots as subjects
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="bg-[#0D1B35] text-[#E2C98A]"
            onClick={() => dispatch({ type: 'ADD_SUBJECT' })}
          >
            + Add subject
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        {state.subjects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            Add Physics, Chemistry, Math, or any subject needed for this exam.
          </p>
        ) : null}
        {state.subjects.map((subject, index) => (
          <SubjectCard key={subject.localId} subject={subject} index={index} dispatch={dispatch} />
        ))}
      </CardContent>
    </Card>
  );
}
