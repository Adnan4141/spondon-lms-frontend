'use client';

import { useMemo } from 'react';
import { useAdminFilters } from './useAdminFilters';

export type AdminNamedEntity = { id: string; name: string };

/** Cached admin dropdown data shared across reports, routine, attendance, etc. */
export function useAdminFilterOptions() {
  const query = useAdminFilters();

  const programs = useMemo(
    () =>
      (query.data?.programs ?? []).map((program) => ({
        id: program.id,
        name: program.name,
      })),
    [query.data?.programs],
  );

  const branches = useMemo(
    () =>
      (query.data?.branches ?? []).map((branch) => ({
        id: branch.id,
        name: branch.name,
      })),
    [query.data?.branches],
  );

  const courses = useMemo(
    () =>
      (query.data?.courses ?? []).map((course) => ({
        id: course.id,
        name: course.name,
        programId: course.programId,
        fee: course.fee,
        offerPrice: course.offerPrice,
        type: course.type,
        startMonth: course.startMonth,
        endMonth: course.endMonth,
      })),
    [query.data?.courses],
  );

  const coursesByProgram = (programId: string) =>
    courses.filter((course) => course.programId === programId);

  const namedCourses = useMemo(
    (): AdminNamedEntity[] => courses.map(({ id, name }) => ({ id, name })),
    [courses],
  );

  const namedPrograms = programs;

  return {
    ...query,
    programs,
    branches,
    courses,
    namedCourses,
    namedPrograms,
    coursesByProgram,
    isMetaLoading: query.isLoading,
  };
}
