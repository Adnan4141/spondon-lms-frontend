'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { getBatches, type Batch } from '@/lib/api/batches';
import {
  EXAM_WIZARD_ALL_BATCHES,
  EXAM_WIZARD_ALL_BRANCHES,
  resolveWizardBranchIdForApi,
} from '../constants';
import type { CourseAudienceScope } from '../audienceScopeHelpers';

type Props = {
  course: Course;
  scope: CourseAudienceScope;
  branches: Branch[];
  onChange: (patch: Partial<CourseAudienceScope>) => void;
};

export function CourseAudienceScopeEditor({ course, scope, branches, onChange }: Props) {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    let cancelled = false;
    const branchId = resolveWizardBranchIdForApi(scope.branchId);
    getBatches({
      all: true,
      status: 'ACTIVE',
      courseId: course.id,
      ...(branchId ? { branchId } : {}),
    })
      .then((res) => {
        if (!cancelled) setBatches(res.success && res.data ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [course.id, scope.branchId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-3 text-sm font-semibold text-slate-900">{course.name}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Branch</Label>
          <Select
            value={scope.branchId || EXAM_WIZARD_ALL_BRANCHES}
            onValueChange={(branchId) => {
              onChange({
                branchId,
                batchId: EXAM_WIZARD_ALL_BATCHES,
              });
            }}
          >
            <SelectTrigger className="h-9 border-slate-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EXAM_WIZARD_ALL_BRANCHES}>All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Batch</Label>
          <Select
            value={scope.batchId || EXAM_WIZARD_ALL_BATCHES}
            onValueChange={(batchId) => onChange({ batchId })}
          >
            <SelectTrigger className="h-9 border-slate-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EXAM_WIZARD_ALL_BATCHES}>All batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                  {batch.branch?.name ? ` · ${batch.branch.name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
