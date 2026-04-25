'use client';

import { useState } from 'react';
import { Toaster } from '@/components/ui/toast';
import type { Course } from '@/types/course';
import { CourseDetailView } from '@/features/admin/courses';
import { CoursesListView } from '@/features/admin/courses';

export default function AdminCoursesPage() {
  const [contentCourse, setContentCourse] = useState<Course | null>(null);
  return (
    <>
      {contentCourse ? (
        <CourseDetailView course={contentCourse} onBack={() => setContentCourse(null)} />
      ) : (
        <CoursesListView onSelectContent={setContentCourse} />
      )}
      <Toaster />
    </>
  );
}
