'use client';

import { CourseResourceForm } from '@/features/admin/courses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CourseContent } from '@/types/course-content';
import type { TeacherAddSegmentContext } from './teacher-course-utils';

type Props = {
  open: boolean;
  courseId: string;
  editingResource: CourseContent | null;
  addContext: TeacherAddSegmentContext;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function TeacherCourseContentDialog({
  open,
  courseId,
  editingResource,
  addContext,
  onOpenChange,
  onSuccess,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {editingResource
              ? 'Edit segment'
              : addContext?.chapterTitle
                ? `Add segment to "${addContext.chapterTitle}"`
                : 'Add new segment'}
          </DialogTitle>
        </DialogHeader>
        <CourseResourceForm
          key={
            editingResource?.id ??
            `new-${addContext?.subjectTitle ?? ''}-${addContext?.chapterTitle ?? ''}-${addContext?.topicTitle ?? ''}`
          }
          courseId={courseId}
          resource={editingResource ?? undefined}
          defaultSubjectTitle={addContext?.subjectTitle}
          defaultChapterTitle={addContext?.chapterTitle}
          defaultTopicTitle={addContext?.topicTitle}
          defaultTopicSortOrder={addContext?.topicSortOrder}
          onSuccess={onSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
