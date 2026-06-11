'use client';

import { useMemo } from 'react';
import { useAdminFilterOptions } from './useAdminFilterOptions';

/** Programs + courses filtered by selected program (from cached admin-filters). */
export function useAdminProgramCourseOptions(selectedProgramId: string) {
  const { programs, courses, coursesByProgram, isMetaLoading, ...rest } = useAdminFilterOptions();

  const filteredCourses = useMemo(
    () => (selectedProgramId ? coursesByProgram(selectedProgramId) : []),
    [selectedProgramId, courses, coursesByProgram],
  );

  return {
    ...rest,
    programs,
    courses: filteredCourses,
    allCourses: courses,
    isMetaLoading,
  };
}
