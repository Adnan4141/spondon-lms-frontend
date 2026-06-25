'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, MessageSquareText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  getMyCourseReview,
  getPublicTestimonials,
  submitCourseReview,
  type MyCourseReviewStatus,
  type Testimonial,
} from '@/lib/api/testimonials';

type Props = {
  courseId: string;
  studentUserId: string | null;
};

function StarRow({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`${n} star`}
        >
          <Star
            className={`h-7 w-7 ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseHubReviewsTab({ courseId, studentUserId }: Props) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [status, setStatus] = useState<MyCourseReviewStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [quote, setQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pub, mine] = await Promise.all([
        getPublicTestimonials({ type: 'COURSE', courseId }),
        studentUserId ? getMyCourseReview(courseId, studentUserId) : Promise.resolve(null),
      ]);
      setReviews(pub.data ?? []);
      if (mine) {
        setStatus(mine.data);
        if (mine.data.myReview) {
          setRating(mine.data.myReview.rating ?? 0);
          setQuote(mine.data.myReview.quote ?? '');
        }
      }
    } catch (e) {
      toast({
        title: 'Reviews',
        description: e instanceof Error ? e.message : 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, studentUserId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const rated = reviews.filter((r) => typeof r.rating === 'number' && (r.rating ?? 0) > 0);
    if (rated.length === 0) return { avg: 0, count: reviews.length, ratedCount: 0 };
    const avg = rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length;
    return { avg: Math.round(avg * 10) / 10, count: reviews.length, ratedCount: rated.length };
  }, [reviews]);

  const handleSubmit = async () => {
    if (!studentUserId) return;
    if (rating < 1) {
      toast({ title: 'Reviews', description: 'Please pick a star rating', variant: 'destructive' });
      return;
    }
    if (!quote.trim()) {
      toast({ title: 'Reviews', description: 'Please write a short review', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitCourseReview({
        actorUserId: studentUserId,
        courseId,
        rating,
        quote: quote.trim(),
      });
      toast({ title: 'Reviews', description: res.message || 'Review submitted for approval' });
      await load();
    } catch (e) {
      toast({
        title: 'Reviews',
        description: e instanceof Error ? e.message : 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Loading reviews…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Submission / eligibility panel */}
      {studentUserId ? <SubmitPanel /> : null}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-900">{summary.avg || '—'}</span>
          <span className="text-sm font-semibold text-slate-400">/ 5</span>
        </div>
        <div>
          <StarRow value={Math.round(summary.avg)} />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-12 text-center">
          <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No reviews yet</p>
          <p className="mt-1 text-xs text-slate-400">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <StarRow value={r.rating ?? 0} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{r.quote}</p>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-sm font-extrabold text-slate-800">{r.name}</p>
                {r.info || r.institute ? (
                  <p className="text-[11px] font-semibold text-slate-400">
                    {[r.institute, r.info].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function SubmitPanel() {
    if (!status) return null;

    if (!status.eligible) {
      const msg =
        status.reason === 'NOT_ENROLLED'
          ? 'You need to be enrolled in this course to leave a review.'
          : `Finish the full course to unlock reviews (your progress: ${status.progressPct}%).`;
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/50 px-5 py-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800">Reviews locked</p>
            <p className="mt-0.5 text-xs font-medium text-amber-700">{msg}</p>
          </div>
        </div>
      );
    }

    const existing = status.myReview;
    return (
      <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-white via-indigo-50/20 to-violet-50/10 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-slate-800">
            {existing ? 'Update your review' : 'Share your review'}
          </p>
          {existing ? (
            <Badge variant={existing.approved ? 'default' : 'secondary'}>
              {existing.approved ? 'Published' : 'Pending approval'}
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />
          <Textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="What did you like about this course?"
            rows={4}
            maxLength={1000}
            disabled={submitting}
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">
              Your review will be visible after admin approval.
            </p>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {existing ? 'Update review' : 'Submit review'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
