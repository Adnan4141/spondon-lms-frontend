'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, ArrowRight, Layers, ListVideo, Star, FileText, Download } from 'lucide-react';
import { getCourseContentsWithProgress } from '@/lib/api/student-portal';
import { getCourseById } from '@/lib/api/courses';
import type { CourseDetails } from '@/types/course';
import { createTestimonial, getPublicTestimonials, type Testimonial } from '@/lib/api/testimonials';
import { groupContentsBySubjectChapter, uniqueSubjectsFromGroups } from '@/lib/course-outline';
import { buildSubjectRouteTable, normalizeSubjectLabel } from '@/lib/course-subject-slugs';

interface ContentItem {
  id: string;
  type: string;
  title: string;
  fileUrl?: string | null;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string;
  durationMinutes?: number;
  sortOrder: number;
  progress?: { completed: boolean; progressPercent?: number } | null;
}

function subjectStats(contents: ContentItem[], subjectTitle: string) {
  const f = contents.filter((c) => normalizeSubjectLabel(c.subjectTitle) === subjectTitle);
  const videos = f.filter((c) => c.type === 'VIDEO');
  const completed = videos.filter((c) => c.progress?.completed).length;
  const pct = videos.length ? Math.round((completed / videos.length) * 100) : 0;
  const chapters = new Set(
    f.map((c) => (c.chapterTitle || '').trim() || (c.topicTitle || '').trim() || 'General'),
  ).size;
  return { segments: f.length, chapters, videos: videos.length, progressPct: pct };
}

export default function StudentCourseHubPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentUserId, setStudentUserId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [reviewForm, setReviewForm] = useState({ quote: '', rating: 5 });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
        setContents(contentsRes.data as ContentItem[]);
      } else {
        setContents([]);
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

  const subjectRows = useMemo(() => {
    const groups = groupContentsBySubjectChapter(contents);
    const titles = uniqueSubjectsFromGroups(groups);
    const table = buildSubjectRouteTable(titles);
    return table.map((row) => ({
      ...row,
      stats: subjectStats(contents, row.title),
    }));
  }, [contents]);

  const syllabusItems = useMemo(() => {
    return contents.filter((c) => c.type === 'SYLLABUS');
  }, [contents]);

  const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

  const courseProgress = useMemo(() => {
    const videos = contents.filter((c) => c.type === 'VIDEO');
    if (!videos.length) return 0;
    const done = videos.filter((c) => c.progress?.completed).length;
    return Math.round((done / videos.length) * 100);
  }, [contents]);

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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/student/courses" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">
            ← আমার কোর্স
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{course?.name || 'কোর্স'}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            প্রথমে একটি <strong className="text-slate-700">বিষয়</strong> বেছে নিন। প্রতিটি বিষয়ের ভিতরে অধ্যায় ও টপিক (ভিডিও, পিডিএফ, নোট) ধাপে ধাপে খুলবে।
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">সামগ্রিক অগ্রগতি</p>
            <p className="text-2xl font-black text-indigo-600">{courseProgress}%</p>
          </div>
          <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </div>
      </div>

      {syllabusItems.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            সিলেবাস
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {syllabusItems.map((item) => {
              const url = item.fileUrl
                ? item.fileUrl.startsWith('http') ? item.fileUrl : `${API_ORIGIN}${item.fileUrl}`
                : null;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 line-clamp-2">{item.title}</h3>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> ডাউনলোড
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          বিষয়সমূহ
        </h2>
        {subjectRows.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="font-bold text-slate-700">এখনও কোনো বিষয় বা কন্টেন্ট যোগ করা হয়নি</p>
              <p className="text-sm text-slate-500 mt-2">অ্যাডমিন কোর্সে রিসোর্স যোগ করলে এখানে বিষয়ভিত্তিক কার্ড দেখা যাবে।</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjectRows.map((row) => (
              <Link
                key={row.slug}
                href={`/student/courses/${courseId}/${row.slug}`}
                className="group block rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {row.title}
                  </h3>
                  <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white group-hover:bg-indigo-600 transition-colors">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 py-2">
                    <p className="text-lg font-black text-slate-800">{row.stats.chapters}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">অধ্যায়</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <p className="text-lg font-black text-slate-800">{row.stats.segments}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">সেগমেন্ট</p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 py-2">
                    <p className="text-lg font-black text-indigo-700">{row.stats.progressPct}%</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">অগ্রগতি</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <ListVideo className="h-3.5 w-3.5" /> {row.stats.videos} ভিডিও
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div id="course-reviews" className="scroll-mt-24 grid gap-6 lg:grid-cols-3">
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
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
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
                      type="button"
                      onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                      className="p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white"
                    >
                      <Star
                        className={`h-5 w-5 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
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
                  className="w-full rounded-xl"
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
                      const msg = err instanceof Error ? err.message : 'রিভিউ পাঠানো যায়নি';
                      alert(msg);
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
