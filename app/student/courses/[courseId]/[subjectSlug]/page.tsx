'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, ExternalLink, FileText, MessageSquare, ArrowLeft, BookOpen, Download, AlertTriangle, Lock, ChevronRight } from 'lucide-react';
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

  const currentIndex = selectedContent ? subjectContents.findIndex((c) => c.id === selectedContent.id) : -1;
  const nextContent = currentIndex !== -1 && currentIndex < subjectContents.length - 1 ? subjectContents[currentIndex + 1] : null;

  const playNextContent = () => {
    if (nextContent) {
      setSelectedContent(nextContent);
      setExpandedTopics((prev) => {
        const next = new Set(prev);
        next.add(contentGroupKey(nextContent));
        return next;
      });
      const url = new URL(window.location.href);
      url.searchParams.set('lesson', nextContent.id);
      window.history.pushState({}, '', url.toString());
    }
  };

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
        : 'aspect-video';  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'discussion'>('overview');

  if (!studentUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black text-slate-800">Access Restricted</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-1.5 mb-6">
          Please log in with your credentials to view and track your course lecture progress.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/10"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading && !course) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-xs mt-4 tracking-wider uppercase">Loading lecture contents...</p>
      </div>
    );
  }

  if (!loading && slugInvalid) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-12">
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Subjects
        </Link>
        <Card className="rounded-2xl border border-rose-150 bg-rose-50/50 p-8 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Subject Not Found</h1>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            The subject in this link is not in the course or has been removed. Choose the correct subject from the course hub.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
            <Link href={`/student/courses/${courseId}`}>Go to Course Page</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!loading && !resolvedSubject && contents.length === 0) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-12">
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Course Hub
        </Link>
        <Card className="rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">No Content Available</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">No lessons or subjects have been added to this course catalog yet.</p>
          <Button asChild className="mt-6 rounded-xl bg-indigo-650 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/student/courses">My Courses</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400 mb-2">
            <Link href="/student/courses" className="text-indigo-600 hover:text-indigo-700 transition-colors">
              My Courses
            </Link>
            <span>/</span>
            <Link href={`/student/courses/${courseId}`} className="text-indigo-600 hover:text-indigo-700 transition-colors truncate max-w-[150px] sm:max-w-none">
              {course?.name || 'Course'}
            </Link>
            <span>/</span>
            <span className="font-extrabold text-slate-700">{resolvedSubject}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/student/courses/${courseId}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              title="Back to Course Hub"
            >
              <ArrowLeft className="h-4.5 w-4.5" strokeWidth={2.5} />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">{resolvedSubject}</h1>
          </div>
          <p className="text-xs font-bold text-slate-455 text-slate-500 mt-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            {course?.name ? `${course.name}` : ''} · {totalLessons} Lessons · {formatDuration(totalMins)} Total
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Progress</p>
            <p className="text-lg font-black text-indigo-600 mt-0.5">{progressPct}%</p>
          </div>
          <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl overflow-hidden border border-slate-250 border-slate-200/70 bg-white shadow-sm shadow-slate-100/50">
            {/* Media Player Frame */}
            <div className={cn(mediaFrameClass, 'bg-slate-950 relative group/player')}>
              {ytBroken ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-amber-200/90 px-6 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
                  <p className="font-bold">This YouTube link could not be loaded.</p>
                  <p className="text-sm mt-2 text-slate-450">Ask your instructor to check the video URL.</p>
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
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-200 px-6 py-20 bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <FileText className="h-8 w-8 text-indigo-400" />
                  </div>
                  <p className="font-bold text-center text-slate-100 max-w-sm leading-relaxed">
                    {selectedContent.type === 'QUIZ'
                      ? 'This segment is an interactive quiz or online assessment'
                      : selectedContent.type === 'ASSIGNMENT'
                        ? 'This segment is a homework assignment'
                        : selectedContent.type === 'LIVE'
                          ? 'Live virtual classroom session — open the link to join'
                          : 'This segment is a external document resource file'}
                  </p>
                  <a
                    href={resolvedMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/20 hover:scale-102 transition-all duration-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {selectedContent.type === 'QUIZ'
                      ? 'Open Quiz Portal'
                      : selectedContent.type === 'ASSIGNMENT'
                        ? 'Open Assignment Sheet'
                        : selectedContent.type === 'LIVE'
                          ? 'Join Live Class'
                          : 'Download Resource'}
                  </a>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 py-24 bg-slate-900">
                  <Play className="h-16 w-16 mb-4 text-slate-500 animate-pulse" />
                  <p className="font-bold text-center px-4 text-slate-300">
                    {selectedContent
                      ? ['VIDEO', 'LINK'].includes(selectedContent.type) && !selectedContent.fileUrl
                        ? 'Add a video file or YouTube link for this lesson'
                        : selectedContent.fileUrl
                          ? 'Preview not available for this item'
                          : selectedContent.title
                      : subjectContents.length === 0
                        ? 'No contents have been uploaded to this subject.'
                        : 'Select a topic from the curriculum sidebar'}
                  </p>
                </div>
              )}
            </div>

            {/* Content Details & Tabs */}
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[19px] font-black text-slate-900 leading-snug truncate">
                    {selectedContent?.title || 'Select a topic from the curriculum'}
                  </h2>
                  {selectedContent?.durationMinutes != null && selectedContent.durationMinutes > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {formatDuration(selectedContent.durationMinutes)} Lecture Video
                    </span>
                  )}
                </div>
                {nextContent && (
                  <button
                    onClick={playNextContent}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/25 shrink-0"
                  >
                    Next Lesson <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.75} />
                  </button>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100 mt-5 mb-5 overflow-x-auto gap-2 scrollbar-none">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'resources', label: 'Notes & Resources' },
                  { id: 'discussion', label: 'Class Q&A Forum' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'px-4.5 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-indigo-650 border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-450 text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {selectedContent?.textBody ? (
                    <p className="text-slate-655 text-slate-600 text-[13.5px] leading-relaxed whitespace-pre-wrap">
                      {selectedContent.textBody}
                    </p>
                  ) : (
                    <p className="text-slate-400 text-xs italic">No additional description is provided for this lecture.</p>
                  )}

                  <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-[12.5px] font-semibold text-amber-800 mt-4">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Security & Privacy Warning</p>
                      <p className="text-amber-700/95 mt-0.5 leading-relaxed">
                        This content is licensed solely for your personal study account. Sharing access credentials, class links, or ripping video streams violates policies and will result in strict account suspension.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <p className="text-slate-500 text-xs font-semibold">Lecture sheets and lecture notes associated with this class:</p>
                  <div className="group flex items-center justify-between gap-4 border border-slate-200/60 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                          {selectedContent?.title || 'Lecture'}_ClassNote.pdf
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">PDF Document · 4.8 MB · 142 Downloads</p>
                      </div>
                    </div>
                    {rawUrl ? (
                      <a
                        href={resolvedMediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
                        Preview Only
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="space-y-4">
                  {/* Discussion comment box */}
                  <div className="border border-slate-200/70 rounded-xl p-3.5 bg-white shadow-sm">
                    <textarea
                      placeholder="Have a doubt? Ask your classroom teacher here..."
                      className="w-full text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none resize-none min-h-[70px] bg-transparent"
                    />
                    <div className="flex justify-end border-t border-slate-100 pt-2.5 mt-2.5">
                      <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5">
                        Ask Question
                      </Button>
                    </div>
                  </div>

                  {/* Comment list */}
                  <div className="space-y-3 pt-2">
                    <div className="border border-slate-150 border-slate-100/80 rounded-xl p-3.5 bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-6 w-6 rounded-full bg-slate-200 text-[10px] font-black text-slate-655 text-slate-600 flex items-center justify-center">
                          AT
                        </div>
                        <div>
                          <p className="text-[11.5px] font-black text-slate-800">Adnan teletalk</p>
                          <p className="text-[9px] font-bold text-slate-400">2 hours ago</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-655 text-slate-600 leading-relaxed font-semibold pl-8">
                        How should we solve question 4 from the practice sheet? Is the domain range rule applicable there?
                      </p>
                      <div className="mt-3 border-t border-slate-200/50 pt-3 pl-8">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-5 w-5 rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700 flex items-center justify-center">
                            S
                          </div>
                          <div>
                            <p className="text-[10.5px] font-black text-slate-800">Spondon Instructor</p>
                            <p className="text-[9px] font-bold text-slate-400">1 hour ago</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-655 text-indigo-950 bg-indigo-50/40 border border-indigo-100/30 rounded-lg p-2.5 leading-relaxed font-semibold">
                          Yes, Adnan. You must apply the domain range rule we covered at 12:40 in this lecture video. Make sure the value under the square root is non-negative.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Curriculum Sidebar */}
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

      {/* Course Review Footer Banner */}
      <Card className="rounded-2xl border border-slate-200/55 bg-gradient-to-r from-white via-indigo-50/20 to-violet-50/10 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-[14.5px]">Provide Course Feedback</p>
              <p className="text-xs text-slate-500 mt-0.5">Let us know how we can improve. Submit your rating on the course main hub.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-xl shrink-0 font-extrabold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <Link href={`/student/courses/${courseId}#course-reviews`}>View Reviews</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
