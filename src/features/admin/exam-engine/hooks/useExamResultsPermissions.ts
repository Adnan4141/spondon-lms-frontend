'use client';

import { useMemo } from 'react';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import {
  canExamResults,
  isOrgWideResultsRole,
  isTeacherEvaluatorRole,
  type ExamResultsCapability,
} from '../examResultsPermissions';

export function useExamResultsPermissions() {
  const { user } = useAdminSession();
  const role = user?.role ?? null;
  const branchScope = role === 'BRANCH_ADMIN' ? user?.branchId ?? null : null;

  const can = useMemo(
    () => (capability: ExamResultsCapability) => canExamResults(role, capability),
    [role],
  );

  return {
    role,
    branchScope,
    isTeacherEvaluator: isTeacherEvaluatorRole(role),
    isOrgWide: isOrgWideResultsRole(role),
    can,
  };
}
