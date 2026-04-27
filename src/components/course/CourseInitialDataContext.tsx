'use client';

import React, { createContext, useContext } from 'react';
import type { CourseDetails } from '@/types/course';

const CourseInitialDataContext = createContext<CourseDetails | null>(null);

export function CourseInitialDataProvider({
  initialCourse,
  children,
}: {
  initialCourse: CourseDetails | null;
  children: React.ReactNode;
}) {
  return (
    <CourseInitialDataContext.Provider value={initialCourse}>
      {children}
    </CourseInitialDataContext.Provider>
  );
}

export function useCourseInitialData() {
  return useContext(CourseInitialDataContext);
}
