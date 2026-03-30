'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Circle, ExternalLink, FileText, Star } from 'lucide-react';
import { getCourseContentsWithProgress, updateContentProgress } from '@/lib/api/student-portal';
import { getCourseById } from '@/lib/api/courses';
import type { CourseDetails } from '@/types/course';
import { isYoutubeContentUrl, parseYoutubeVideoId, toYoutubeEmbedSrc } from '@/lib/youtube';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import { createTestimonial, getPublicTestimonials, type Testimonial } from '@/lib/api/testimonials';

interface ContentItem {
  id: string;
  type: string;
  title: string;
  fileUrl?: string;
  textBody?: string;
  topicTitle?: string;
  topicSortOrder?: number;
  durationMinutes?: number;
  sortOrder: number;
  progress?: { completed: boolean; progressPercent?: number } | null;
}

function formatDuration(min: number) {
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}min`;
  return `${min}min`;
}

function groupByTopic(contents: ContentItem[]) {
  const groups: { topic: string; sortOrder: number; items: ContentItem[] }[] = [];
  const map = new Map<string, ContentItem[]>();

  for (const c of contents) {
    const topic = c.topicTitle || 'Uncategorized';
    const so = c.topicSortOrder ?? 999;
    if (!map.has(topic)) {
      map.set(topic, []);
      groups.push({ topic, sortOrder: so, items: [] });
    }
    map.get(topic)!.push(c);
  }

  for (const g of groups) {
    g.items = map.get(g.topic)!.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  groups.sort((a, b) => a.sortOrder - b.sortOrder);

  return groups;
}

export default function StudentCourseLearnPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [studentUserId, setStudentUserId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [reviewForm, setReviewForm] = useState({ quote: '', rating: 5 });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsed = u ? JSON.parse(u) : null;
      setStudentUserId(parsed?.id ?? null);
      setStudentName(parsed?.fullName ?? '');
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
      const [courseRes, contentsRes] = await Promise.all([
        getCourseById(courseId),
        getCourseContentsWithProgress(courseId, studentUserId),
      ]);
      if (courseRes.success && courseRes.data) setCourse(courseRes.data as CourseDetails);
      if (contentsRes.success && contentsRes.data) {
        const items = contentsRes.data as ContentItem[];
        setContents(items);
        if (items.length > 0) {
          const firstVideo = items.find((c) => c.type === 'VIDEO' && c.fileUrl) || items[0];
          setSelectedContent(firstVideo);
          setExpandedTopics(new Set([firstVideo.topicTitle || 'Uncategorized']));
        }
      }
    } catch (err) {
      console.error(err);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, studentUserId]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await getPublicTestimonials();
      if (res.success && res.data) {
        setReviews(res.data.filter((t) => t.course?.id === courseId));
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
    loadReviews();
  }, [fetchData, loadReviews]);

  const markProgress = useCallback(
    async (contentId: string, completed: boolean, progressPercent?: number) => {
      if (!studentUserId) return;
      try {
        await updateContentProgress({ studentUserId, contentId, completed, progressPercent });
        setContents((prev) =>
          prev.map((c) =>
            c.id === contentId
              ? { ...c, progress: { completed, progressPercent: progressPercent ?? c.progress?.progressPercent ?? 0 } }
              : c
          )
        );
      } catch (err) {
        console.error(err);
      }
    },
    [studentUserId]
  );

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !selectedContent || !studentUserId) return;
    const pct = v.duration ? Math.min(100, Math.round((v.currentTime / v.duration) * 100)) : 0;
    if (pct >= 90) markProgress(selectedContent.id, true, 100);
  };

  const handleVideoEnded = () => {
    if (selectedContent && studentUserId) markProgress(selectedContent.id, true, 100);
  };

  const groups = groupByTopic(contents);
  const totalLessons = contents.filter((c) => c.type === 'VIDEO').length;
  const completedCount = contents.filter((c) => c.progress?.completed).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const totalMins = contents.reduce((s, c) => s + (c.durationMinutes ?? 0), 0);

  const rawUrl = selectedContent?.fileUrl;
  const resolvedMediaUrl = rawUrl ? resolveAttachmentUrl(rawUrl, API_ORIGIN) : '';
  const embedYoutubeId =
    rawUrl && isYoutubeContentUrl(rawUrl) ? parseYoutubeVideoId(rawUrl) : null;
  const ytBroken = !!(rawUrl && isYoutubeContentUrl(rawUrl) && !embedYoutubeId);
  const treatAsPdf =
    !!rawUrl && (selectedContent?.type === 'PDF' || /\.pdf(\?|#|$)/i.test(rawUrl));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/student/courses" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">
            ← Back to My Courses
          </Link>
          <h1 className="text-3xl font-black text-slate-900">{course?.name || 'Course'}</h1>
          <p className="text-slate-500 mt-1">
            {totalLessons} lessons · {formatDuration(totalMins)} total
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</p>
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
                <iframe
                  key={selectedContent!.id}
                  title={selectedContent!.title}
                  src={toYoutubeEmbedSrc(embedYoutubeId)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : selectedContent?.type === 'VIDEO' && rawUrl ? (
                <video
                  ref={videoRef}
                  key={selectedContent.id}
                  src={resolvedMediaUrl}
                  controls
                  className="w-full h-full"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  onPlay={() => {}}
                />
              ) : selectedContent && selectedContent.type !== 'VIDEO' && rawUrl ? (
                treatAsPdf ? (
                  <iframe
                    title={selectedContent.title}
                    src={resolvedMediaUrl}
                    className="w-full h-full min-h-[480px] border-0 bg-white"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-200 px-6">
                    <FileText className="h-14 w-14 opacity-40" />
                    <p className="font-bold text-center">This segment is a linked file or page</p>
                    <a
                      href={resolvedMediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open link
                    </a>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Play className="h-16 w-16 mb-4 opacity-50" />
                  <p className="font-bold text-center px-4">
                    {selectedContent
                      ? selectedContent.type === 'VIDEO' && !selectedContent.fileUrl
                        ? 'Add a video file or YouTube link for this lesson'
                        : selectedContent.fileUrl
                          ? 'Preview not available for this item'
                          : selectedContent.title
                      : 'Select a lesson'}
                  </p>
                  {selectedContent && selectedContent.type !== 'VIDEO' && !selectedContent.fileUrl && (
                    <p className="text-sm mt-2 text-center px-4">Upload a file or add a link when editing this segment.</p>
                  )}
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-black text-slate-900">
                {selectedContent?.title || 'Select a lesson from the sidebar'}
              </h2>
              {selectedContent?.durationMinutes != null && selectedContent.durationMinutes > 0 && (
                <p className="text-slate-500 text-sm mt-1">{formatDuration(selectedContent.durationMinutes)}</p>
              )}
              {selectedContent?.textBody ? (
                <p className="text-slate-600 text-sm mt-4 whitespace-pre-wrap">{selectedContent.textBody}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900">Course content</h3>
          <Card className="rounded-2xl border border-slate-100 overflow-hidden">
            <CardContent className="p-0">
              {groups.map((g) => {
                const topicDuration = g.items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
                const isExpanded = expandedTopics.has(g.topic);
                return (
                  <div key={g.topic} className="border-b border-slate-100 last:border-0">
                    <button
                      onClick={() =>
                        setExpandedTopics((prev) => {
                          const next = new Set(prev);
                          if (next.has(g.topic)) next.delete(g.topic);
                          else next.add(g.topic);
                          return next;
                        })
                      }
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="font-bold text-slate-900">{g.topic}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{formatDuration(topicDuration)}</span>
                    </button>
                    {isExpanded && (
                      <div className="bg-slate-50/50">
                        {g.items.map((item) => {
                          const isSelected = selectedContent?.id === item.id;
                          const isCompleted = item.progress?.completed;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedContent(item)}
                              className={`w-full flex items-center gap-3 px-5 py-3 pl-12 hover:bg-white/80 transition-colors text-left ${
                                isSelected ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                              )}
                              <Play className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className={`flex-1 font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {item.title}
                              </span>
                              {item.durationMinutes != null && (
                                <span className="text-xs text-slate-400">{item.durationMinutes} min</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {groups.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-500">
                  <p>No course content yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Course reviews</p>
                <h3 className="text-xl font-black text-slate-900">এই কোর্সের রিভিউ</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">{reviews.length} reviews</span>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">এখনও কোনো রিভিউ নেই।</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{r.name}</h4>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                    {r.info && <p className="text-xs text-slate-400 mt-1">{r.info}</p>}
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">{r.quote}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">আপনার মতামত</p>
            <h3 className="text-lg font-black text-slate-900">কোর্স রিভিউ দিন</h3>
            {!studentUserId ? (
              <p className="text-sm text-rose-500">রিভিউ দিতে লগইন থাকতে হবে।</p>
            ) : (
              <>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                      className="p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white"
                    >
                      <Star className={`h-5 w-5 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={5}
                  placeholder="আপনার অভিজ্ঞতা লিখুন..."
                  value={reviewForm.quote}
                  onChange={(e) => setReviewForm((p) => ({ ...p, quote: e.target.value }))}
                />
                <Button
                  className="w-full"
                  disabled={reviewSubmitting || !reviewForm.quote.trim()}
                  onClick={async () => {
                    if (!studentUserId) return;
                    try {
                      setReviewSubmitting(true);
                      await createTestimonial({
                        name: studentName || 'Student',
                        info: course?.name,
                        quote: reviewForm.quote.trim(),
                        rating: reviewForm.rating,
                        courseId,
                        studentUserId,
                      });
                      setReviewForm({ quote: '', rating: 5 });
                      await loadReviews();
                      alert('রিভিউ পাঠানো হয়েছে। অনুমোদনের পর প্রকাশ হবে।');
                    } catch (err) {
                      console.error(err);
                      alert('রিভিউ পাঠানো যায়নি');
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                >
                  জমা দিন
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
