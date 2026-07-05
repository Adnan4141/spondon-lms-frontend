'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, MessageCircle, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CourseDetails } from '@/types/course';
import type { CourseCollaborator } from '@/lib/api/course-collaborators';
import type { CourseDetailTeacher } from '@/types/course';
import { thumbnailSrc } from './teacher-course-utils';

type Props = {
  course: CourseDetails;
  courseId: string;
  teacherRow?: CourseDetailTeacher;
  collabRow?: CourseCollaborator;
  canEdit: boolean;
};

export function TeacherCourseHub({
  course,
  courseId,
  teacherRow,
  collabRow,
  canEdit,
}: Props) {
  const thumb = thumbnailSrc(course.thumbnail);

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/courses"
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All my lessons
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="relative aspect-video w-full shrink-0 bg-slate-100 lg:aspect-auto lg:w-72 lg:min-h-[220px]">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <Play className="h-16 w-16 opacity-40" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-5 sm:p-6">
            <div>
              <p className="mb-1 font-mono text-xs font-bold text-slate-400">{course.slug}</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {course.name}
              </h1>
              {course.program?.name ? (
                <p className="mt-2 font-bold text-slate-600">{course.program.name}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-lg font-bold">
                {course.type}
              </Badge>
              <Badge variant="outline" className="rounded-lg font-bold">
                {course.status}
              </Badge>
              {teacherRow ? (
                <Badge className="rounded-lg border-0 bg-indigo-600 font-black text-white">
                  Teacher
                </Badge>
              ) : null}
              {collabRow ? (
                <Badge variant="secondary" className="rounded-lg font-black">
                  Collaborator
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className={
                  canEdit
                    ? 'rounded-lg border-emerald-200 bg-emerald-50 font-bold text-emerald-700'
                    : 'rounded-lg border-slate-200 font-bold text-slate-500'
                }
              >
                {canEdit ? 'Can upload' : 'View only'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl font-bold" asChild>
                <Link href={`/teacher/doubts?courseId=${courseId}`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Student doubts
                </Link>
              </Button>
              <Button variant="outline" className="rounded-xl font-bold" asChild>
                <Link href={`/student/courses/${courseId}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview as student
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
