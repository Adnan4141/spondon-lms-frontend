'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CourseHubHero,
  CourseHubSubjectList,
  CourseHubResourcesTab,
  CourseHubReviewsTab,
  CourseHubStats,
  CourseHubSidebar,
  CourseHubSkeleton,
  buildSubjectRows,
  computeCourseProgress,
  countSubjectStatuses,
  pickResumeLesson,
} from '@/components/student/course-hub';

const VALID_TABS = new Set(['learn', 'resources', 'reviews']);
import { useCourseHubData } from '@/lib/query/hooks/useCourseHubData';
import { useCourseHubEnrollment } from '@/lib/query/hooks/useCourseHubEnrollment';

export default function StudentCourseHubPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('learn');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.has(tab)) setActiveTab(tab);
  }, [searchParams]);

  const {
    course,
    contents,
    accessEndedMonth,
    courseRouteId,
    studentUserId,
    authChecked,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourseHubData(courseId);

  const { enrollment } = useCourseHubEnrollment(courseId, course?.slug);

  const subjectRows = useMemo(() => buildSubjectRows(contents), [contents]);
  const syllabusItems = useMemo(
    () => contents.filter((c) => c.type === 'SYLLABUS'),
    [contents],
  );
  const courseProgress = useMemo(() => computeCourseProgress(contents), [contents]);
  const resume = useMemo(
    () => pickResumeLesson(contents, courseRouteId),
    [contents, courseRouteId],
  );
  const subjectStats = useMemo(() => countSubjectStatuses(subjectRows), [subjectRows]);

  const teachersCount = (course?.teachers ?? []).filter((t) => t.teacher).length;
  const resourcesCount =
    syllabusItems.length +
    (course?.courseBooks?.length ?? 0) +
    (course?.features?.length ?? 0) +
    (course?.description ? 1 : 0);

  if (!authChecked || (studentUserId && isLoading && !course)) {
    return <CourseHubSkeleton />;
  }

  if (!studentUserId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="mb-4 text-sm text-slate-600">Please log in to view this course.</p>
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  if (isError && !course) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-10 text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-rose-500" />
        <p className="font-semibold text-slate-900">Could not load course</p>
        <p className="mt-1 mb-5 text-sm text-slate-600">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (accessEndedMonth) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <BookOpen className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Course access ended</h1>
        <p className="mt-3 max-w-md text-slate-500">
          Your access to this course ended from {accessEndedMonth}. You can enroll again later if
          admission is available.
        </p>
        <Link href="/student/courses" className="mt-6">
          <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
            Back to My Courses
          </Button>
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-600">Course not found.</p>
        <Link
          href="/student/courses"
          className="mt-4 text-sm font-medium text-indigo-600 hover:underline"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full space-y-5">
      <CourseHubHero
        course={course}
        courseProgress={courseProgress}
        resume={resume}
        enrollment={enrollment}
      />

      {subjectRows.length > 0 ? (
        <CourseHubStats
          total={subjectStats.total}
          inProgress={subjectStats.inProgress}
          completed={subjectStats.completed}
        />
      ) : null}

      {courseProgress >= 100 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
          Course complete — great work! Review any subject below to refresh your knowledge.
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
            <div className="sticky top-16 z-30 -mx-1 bg-[#F8FAFC]/95 px-1 pb-0 backdrop-blur-sm">
              <TabsList
                variant="line"
                className="h-auto w-full justify-start border-b border-slate-200/80 pb-0 gap-2"
              >
                <TabsTrigger
                  value="learn"
                  className="group gap-2 px-4 pb-3 text-sm font-semibold transition-all data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 data-[state=active]:font-bold"
                >
                  Learn
                  {subjectRows.length > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 group-data-[state=active]:bg-indigo-50 group-data-[state=active]:text-indigo-600 transition-colors">
                      {subjectRows.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="group gap-2 px-4 pb-3 text-sm font-semibold transition-all data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 data-[state=active]:font-bold"
                >
                  Resources
                  {resourcesCount > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 group-data-[state=active]:bg-indigo-50 group-data-[state=active]:text-indigo-600 transition-colors">
                      {resourcesCount}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="group gap-2 px-4 pb-3 text-sm font-semibold transition-all data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 data-[state=active]:font-bold"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="learn" className="mt-3">
              <CourseHubSubjectList subjects={subjectRows} courseRouteId={courseRouteId} />
            </TabsContent>

            <TabsContent value="resources" className="mt-3">
              <CourseHubResourcesTab course={course} syllabusItems={syllabusItems} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-3">
              <CourseHubReviewsTab courseId={courseId} studentUserId={studentUserId} />
            </TabsContent>
          </Tabs>
        </div>

        <CourseHubSidebar
          course={course}
          resume={resume}
          teachersCount={teachersCount}
          resourcesCount={resourcesCount}
          onResourcesClick={() => setActiveTab('resources')}
        />
      </div>
    </div>
  );
}
