'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, BookOpen, Layers, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { deleteCourseContent } from '@/lib/api/courses';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useToast } from '@/hooks/use-toast';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';
import type { CourseContent } from '@/types/course-content';
import { TeacherCourseHub } from './TeacherCourseHub';
import { TeacherCourseStats } from './TeacherCourseStats';
import { TeacherMaterialsTab } from './TeacherMaterialsTab';
import { TeacherCurriculumTab } from './TeacherCurriculumTab';
import { TeacherCourseContentDialog } from './TeacherCourseContentDialog';
import { TeacherCourseDetailSkeleton } from './TeacherCourseDetailSkeleton';
import { useTeacherCourseDetail } from './useTeacherCourseDetail';
import {
  accessFlags,
  computeContentStats,
  type TeacherAddSegmentContext,
} from './teacher-course-utils';

type Props = {
  courseId: string;
};

export function TeacherCourseDetailPageContent({ courseId }: Props) {
  const { toast } = useToast();
  const { user, authChecked, isTeacher } = useTeacherSession();
  const userId = user?.id ?? null;

  const {
    course,
    collaborators,
    contents,
    forbidden,
    isLoading,
    isError,
    error,
    refetchAll,
  } = useTeacherCourseDetail(courseId, userId);

  const [activeTab, setActiveTab] = useState<'materials' | 'curriculum'>('materials');
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CourseContent | null>(null);
  const [addContext, setAddContext] = useState<TeacherAddSegmentContext>(null);

  const access = useMemo(() => {
    if (!course || !userId) {
      return { canEdit: false, teacherRow: undefined, collabRow: undefined };
    }
    return accessFlags(userId, course, collaborators);
  }, [course, userId, collaborators]);

  const stats = useMemo(() => computeContentStats(contents), [contents]);

  const openAdd = (ctx?: TeacherAddSegmentContext) => {
    setEditingResource(null);
    setAddContext(ctx ?? null);
    setContentDialogOpen(true);
  };

  const openEdit = (item: CourseContent) => {
    setAddContext(null);
    setEditingResource(item);
    setContentDialogOpen(true);
  };

  const closeContentDialog = () => {
    setContentDialogOpen(false);
    setEditingResource(null);
    setAddContext(null);
  };

  const handleDelete = async (row: CourseContent) => {
    if (!access.canEdit) return;
    if (
      !(await confirmAction({
        title: 'Delete segment?',
        description: `Delete "${row.title}"? This action cannot be undone.`,
        confirmLabel: 'Delete segment',
        variant: 'danger',
      }))
    ) {
      return;
    }
    try {
      const res = await deleteCourseContent(row.id);
      if (res.success) {
        toast({ title: 'Removed', description: 'Segment deleted' });
        await refetchAll();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  if (!authChecked) {
    return <TeacherCourseDetailSkeleton />;
  }

  if (!userId) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-slate-600">Please log in.</p>
        <Link href="/login" className="font-bold text-indigo-600">
          Log in
        </Link>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-600">Teachers only.</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="space-y-6">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my lessons
        </Link>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center">
          <p className="font-bold text-rose-800">
            You do not have access to this course (not assigned as teacher or collaborator).
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <TeacherCourseDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-10 text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-rose-500" />
        <p className="font-semibold text-slate-900">Could not load course</p>
        <p className="mt-1 mb-5 text-sm text-slate-600">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetchAll()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-slate-600">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <TeacherCourseHub
        course={course}
        courseId={courseId}
        teacherRow={access.teacherRow}
        collabRow={access.collabRow}
        canEdit={access.canEdit}
      />

      <TeacherCourseStats
        subjectCount={stats.subjectCount}
        chapterCount={stats.chapterCount}
        segmentCount={stats.segmentCount}
        videoCount={stats.videoCount}
        docCount={stats.docCount}
        totalDurationMinutes={stats.totalDurationMinutes}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'materials' | 'curriculum')}
        className="gap-5"
      >
        <div className="overflow-x-auto">
          <TabsList
            variant="line"
            className="h-auto w-full min-w-0 justify-start gap-1 border-b border-slate-200/80 pb-0 sm:gap-2"
          >
            <TabsTrigger
              value="materials"
              className="gap-2 px-3 pb-3 text-sm font-semibold data-[state=active]:font-bold data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 sm:px-4"
            >
              <BookOpen className="h-4 w-4" />
              Materials
              {stats.segmentCount > 0 ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                  {stats.segmentCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              className="gap-2 px-3 pb-3 text-sm font-semibold data-[state=active]:font-bold data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 sm:px-4"
            >
              <Layers className="h-4 w-4" />
              Curriculum
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="materials" className="space-y-4">
          <TeacherMaterialsTab
            subjects={stats.subjects}
            segmentCount={stats.segmentCount}
            canEdit={access.canEdit}
            onAddSegment={openAdd}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="curriculum">
          <TeacherCurriculumTab courseId={course.id} />
        </TabsContent>
      </Tabs>

      <TeacherCourseContentDialog
        open={contentDialogOpen}
        courseId={course.id}
        editingResource={editingResource}
        addContext={addContext}
        onOpenChange={(open) => !open && closeContentDialog()}
        onSuccess={() => {
          closeContentDialog();
          void refetchAll();
        }}
      />
    </div>
  );
}
