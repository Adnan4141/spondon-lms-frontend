'use client';

import { useParams } from 'next/navigation';
import { TeacherCourseDetailPageContent } from '@/features/teacher/courses';

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return <TeacherCourseDetailPageContent courseId={courseId} />;
}
