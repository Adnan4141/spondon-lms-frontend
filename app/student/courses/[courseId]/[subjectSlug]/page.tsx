'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { getCourseContentsWithProgress, updateContentProgress } from '@/lib/api/student-portal';
import { getCourseById } from '@/lib/api/courses';
import type { CourseDetails } from '@/types/course';
import { isYoutubeContentUrl, parseYoutubeVideoId } from '@/lib/youtube';
import { YoutubePlayer } from '@/components/student/course/YoutubePlayer';
import { HostedVideoPlayer } from '@/components/student/course/HostedVideoPlayer';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import { groupContentsBySubjectChapter, uniqueSubjectsFromGroups } from '@/lib/course-outline';
import {
  buildSubjectRouteTable,
  resolveSubjectTitleFromSlug,
  normalizeSubjectLabel,
} from '@/lib/course-subject-slugs';
import { CourseContentSidebar } from '@/components/student/course/CourseContentSidebar';

interface ContentItem {
  id: string;
  type: string;
  title: string;
  fileUrl?: string;
  textBody?: string;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string;
  topicSortOrder?: number;
  durationMinutes?: number;
  sortOrder: number;
  /** When set, progress is stored on `LessonResourceProgress` instead of legacy `ContentProgress`. */
  lessonResourceId?: string | null;
  progress?: { completed: boolean; progressPercent?: number } | null;
}

/** Hosted file or YouTube — should open in the main player, not only legacy `type === 'VIDEO'`. */
function isVideoLikeItem(c: ContentItem): boolean {
  const u = c.fileUrl;
  if (!u) return false;
  if (c.type === 'VIDEO') return true;
  return isYoutubeContentUrl(u);
}

function formatDuration(min: number) {
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}min`;
  return `${min}min`;
}

function contentGroupKey(c: ContentItem) {
  const subject = normalizeSubjectLabel(c.subjectTitle);
  const chapter =
    (c.chapterTitle || '').trim() || (c.topicTitle || '').trim() || 'General';
  return `${subject}\n${chapter}`;
}

export default function StudentCourseSubjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const courseId = params.courseId as string;
  const subjectSlug = params.subjectSlug as string;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [studentUserId, setStudentUserId] = useState<string | null>(null);
  const [studentPhone, setStudentPhone] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [resolvedSubject, setResolvedSubject] = useState<string | null>(null);
  const [slugInvalid, setSlugInvalid] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsed = u ? JSON.parse(u) : null;
      setStudentUserId(parsed?.id ?? null);
      setStudentPhone(parsed?.mobile ?? null);
      setStudentName(parsed?.fullName ?? null);
    } catch {
      setStudentUserId(null);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!courseId || !studentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setSlugInvalid(false);
      const courseRes = await getCourseById(courseId);
      const loadedCourse = courseRes.success && courseRes.data ? courseRes.data as CourseDetails : null;
      const resolvedCourseId = loadedCourse?.id ?? courseId;
      if (loadedCourse) setCourse(loadedCourse);

      const contentsRes = await getCourseContentsWithProgress(resolvedCourseId, studentUserId);
      const items = (contentsRes.success && contentsRes.data ? contentsRes.data : []) as ContentItem[];
      setContents(items);

      if (items.length === 0) {
        setResolvedSubject(null);
        setSlugInvalid(false);
        setSelectedContent(null);
        setLoading(false);
        return;
      }

      const groupsAll = groupContentsBySubjectChapter(items);
      const titles = uniqueSubjectsFromGroups(groupsAll);
      const table = buildSubjectRouteTable(titles);
      const subjectTitle = resolveSubjectTitleFromSlug(subjectSlug, table);

      if (!subjectTitle) {
        setSlugInvalid(true);
        setResolvedSubject(null);
        setSelectedContent(null);
        setLoading(false);
        return;
      }

      setResolvedSubject(subjectTitle);
      const filtered = items.filter((c) => normalizeSubjectLabel(c.subjectTitle) === subjectTitle);
      if (filtered.length > 0) {
        const lessonMatch = lessonId ? filtered.find((c) => c.id === lessonId) : null;
        const firstVideo =
          lessonMatch ??
          filtered.find((c) => isVideoLikeItem(c)) ??
          filtered[0];
        setSelectedContent(firstVideo);
        setExpandedTopics(new Set([contentGroupKey(firstVideo)]));
      } else {
        setSelectedContent(null);
      }
    } catch (err) {
      console.error(err);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, studentUserId, subjectSlug, lessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markProgress = useCallback(
    async (item: ContentItem, completed: boolean, progressPercent?: number) => {
      if (!studentUserId) return;
      try {
        await updateContentProgress({
          studentUserId,
          ...(item.lessonResourceId
            ? { lessonResourceId: item.lessonResourceId }
            : { contentId: item.id }),
          completed,
          progressPercent,
        });
        setContents((prev) =>
          prev.map((c) =>
            c.id === item.id
              ? {
                  ...c,
                  progress: {
                    completed,
                    progressPercent: progressPercent ?? c.progress?.progressPercent ?? 0,
                  },
                }
              : c,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    },
    [studentUserId],
  );

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !selectedContent || !studentUserId) return;
    const pct = v.duration ? Math.min(100, Math.round((v.currentTime / v.duration) * 100)) : 0;
    if (pct >= 90) markProgress(selectedContent, true, 100);
  };

  const handleVideoEnded = () => {
    if (selectedContent && studentUserId) markProgress(selectedContent, true, 100);
  };

  const subjectContents = useMemo(
    () =>
      resolvedSubject
        ? contents.filter((c) => normalizeSubjectLabel(c.subjectTitle) === resolvedSubject)
        : [],
    [contents, resolvedSubject],
  );

  const groups = useMemo(() => groupContentsBySubjectChapter(subjectContents), [subjectContents]);
  const subjectListForSidebar = useMemo(
    () => (resolvedSubject ? [resolvedSubject] : []),
    [resolvedSubject],
  );

  useEffect(() => {
    if (!resolvedSubject) return;
    const subjGroups = groups.filter((g) => g.subject === resolvedSubject);
    if (subjGroups.length) {
      setExpandedTopics((prev) => {
        const next = new Set(prev);
        next.add(subjGroups[0].key);
        return next;
      });
    }
  }, [resolvedSubject, groups]);

  const totalLessons = subjectContents.filter((c) => c.type === 'VIDEO').length;
  const completedCount = subjectContents.filter((c) => c.progress?.completed).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const totalMins = subjectContents.reduce((s, c) => s + (c.durationMinutes ?? 0), 0);

  const rawUrl = selectedContent?.fileUrl;
  const resolvedMediaUrl = rawUrl ? resolveAttachmentUrl(rawUrl, API_ORIGIN) : '';
  const embedYoutubeId =
    rawUrl && isYoutubeContentUrl(rawUrl) ? parseYoutubeVideoId(rawUrl) : null;
  const ytBroken = !!(rawUrl && isYoutubeContentUrl(rawUrl) && !embedYoutubeId);
  const treatAsPdf =
    !!rawUrl &&
    (selectedContent?.type === 'PDF' ||
      selectedContent?.type === 'SAMPLE' ||
      /\.pdf(\?|#|$)/i.test(rawUrl));
  const mediaFrameClass =
    selectedContent?.type === 'VIDEO' || (rawUrl && isYoutubeContentUrl(rawUrl))
      ? 'aspect-video'
      : rawUrl
        ? 'min-h-[480px]'
        : 'aspect-video';

  if (!studentUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-600 mb-4">Please log in to view this course.</p>
        <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
          Log in
        </Link>
      </div>
    );
  }

  if (loading && !course) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && slugInvalid) {
    return (
      <div className="space-y-6 max-w-lg">
        <Link
          href={`/student/courses/${courseId}`}
          className="text-sm text-indigo-600 hover:underline inline-block"
        >
          ← Back to Subjects
        </Link>
        <Card className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8">
          <h1 className="text-xl font-black text-slate-900">Subject Not Found</h1>
          <p className="text-slate-600 mt-2">
            The subject in this link is not in the course or has been removed. Choose the correct subject from the course hub.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href={`/student/courses/${courseId}`}>Go to Course Page</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!loading && !resolvedSubject && contents.length === 0) {
    return (
      <div className="space-y-6 max-w-lg">
        <Link href={`/student/courses/${courseId}`} className="text-sm text-indigo-600 hover:underline">
          ← Course Hub
        </Link>
        <Card className="rounded-2xl border border-slate-100 p-8">
          <h1 className="text-xl font-black text-slate-900">No Content</h1>
          <p className="text-slate-600 mt-2">No lessons have been added to this course yet.</p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/student/courses">My Courses</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/student/courses" className="text-indigo-600 hover:underline">
              My Courses
            </Link>
            <span>/</span>
            <Link href={`/student/courses/${courseId}`} className="text-indigo-600 hover:underline">
              {course?.name || 'Course'}
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-800">{resolvedSubject}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{resolvedSubject}</h1>
          <p className="text-slate-500 mt-1">
            {course?.name ? `Course: ${course.name}` : ''} · {totalLessons} videos ·{' '}
            {formatDuration(totalMins)} total
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Progress</p>
            <p className="text-xl font-black text-indigo-600">{progressPct}%</p>
          </div>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl overflow-hidden border-none shadow-lg">
            <div className={`${mediaFrameClass} bg-slate-900`}>
              {ytBroken ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-amber-200/90 px-6 text-center">
                  <p className="font-bold">This YouTube link could not be loaded.</p>
                  <p className="text-sm mt-2 text-slate-400">Ask your instructor to check the video URL.</p>
                </div>
              ) : embedYoutubeId ? (
                <YoutubePlayer
                  key={selectedContent!.id}
                  videoId={embedYoutubeId}
                  courseTitle={course?.name ?? selectedContent!.title}
                  studentPhone={studentPhone}
                  studentName={studentName}
                  onEnded={handleVideoEnded}
                />
              ) : treatAsPdf && rawUrl ? (
                <iframe
                  title={selectedContent?.title || 'PDF preview'}
                  src={resolvedMediaUrl}
                  className="w-full h-full min-h-[480px] border-0 bg-white"
                />
              ) : selectedContent?.type === 'VIDEO' && rawUrl ? (
                <HostedVideoPlayer
                  contentId={selectedContent.id}
                  src={resolvedMediaUrl}
                  studentPhone={studentPhone}
                  studentName={studentName}
                  videoRef={videoRef}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                />
              ) : selectedContent && rawUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-200 px-6">
                  <FileText className="h-14 w-14 opacity-40" />
                  <p className="font-bold text-center">
                    {selectedContent.type === 'QUIZ'
                      ? 'This segment is a quiz or assessment'
                      : selectedContent.type === 'ASSIGNMENT'
                        ? 'This segment is an assignment'
                        : selectedContent.type === 'LIVE'
                          ? 'Live session — open the link to join'
                          : 'This segment is a linked file or page'}
                  </p>
                  <a
                    href={resolvedMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {selectedContent.type === 'QUIZ'
                      ? 'Open quiz'
                      : selectedContent.type === 'ASSIGNMENT'
                        ? 'Open assignment'
                        : selectedContent.type === 'LIVE'
                          ? 'Join link'
                          : 'Open link'}
                  </a>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Play className="h-16 w-16 mb-4 opacity-50" />
                  <p className="font-bold text-center px-4">
                    {selectedContent
                      ? ['VIDEO', 'LINK'].includes(selectedContent.type) && !selectedContent.fileUrl
                        ? 'Add a video file or YouTube link for this lesson'
                        : selectedContent.fileUrl
                          ? 'Preview not available for this item'
                          : selectedContent.title
                      : subjectContents.length === 0
                        ? 'No content in this subject yet'
                        : 'Select a topic'}
                  </p>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-black text-slate-900">
                {selectedContent?.title || 'Select a chapter and topic from the sidebar'}
              </h2>
              {selectedContent?.durationMinutes != null && selectedContent.durationMinutes > 0 && (
                <p className="text-slate-500 text-sm mt-1">{formatDuration(selectedContent.durationMinutes)}</p>
              )}
              {selectedContent?.textBody ? (
                <p className="text-slate-600 text-sm mt-4 whitespace-pre-wrap">{selectedContent.textBody}</p>
              ) : null}
              {embedYoutubeId ? (
                <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  This lesson is for your enrolled account only. Sharing course links, video links, or account access is prohibited.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <CourseContentSidebar
          groups={groups}
          subjects={subjectListForSidebar}
          activeSubject={resolvedSubject || 'Course'}
          onSubjectChange={() => {}}
          expandedTopics={expandedTopics}
          setExpandedTopics={setExpandedTopics}
          selectedContentId={selectedContent?.id ?? null}
          onSelectContent={setSelectedContent}
          formatDuration={formatDuration}
          loading={loading}
        />
      </div>

      <Card className="rounded-2xl border border-slate-100 bg-slate-50/50">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="font-bold text-slate-900">Course Review</p>
              <p className="text-sm text-slate-500">Go to the course hub to view and submit a review.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-xl shrink-0">
            <Link href={`/student/courses/${courseId}#course-reviews`}>Go to Course Hub</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
