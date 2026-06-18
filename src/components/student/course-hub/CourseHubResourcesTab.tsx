import { BookOpen, Download, FileText } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { CourseDetails } from '@/types/course';
import type { HubContentItem } from './course-hub-types';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

type Props = {
  course: CourseDetails;
  syllabusItems: HubContentItem[];
};

export function CourseHubResourcesTab({ course, syllabusItems }: Props) {
  const books = course.courseBooks ?? [];
  const features = course.features ?? [];
  const hasSyllabus = syllabusItems.length > 0;
  const hasBooks = books.length > 0;
  const hasFeatures = features.length > 0;

  if (!hasSyllabus && !hasBooks && !hasFeatures) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center text-sm text-slate-500">
        No resources have been added to this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {hasSyllabus ? (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-emerald-600" />
            Syllabus
          </h3>
          <div className="space-y-2">
            {syllabusItems.map((item) => {
              const url = item.fileUrl
                ? item.fileUrl.startsWith('http')
                  ? item.fileUrl
                  : `${API_ORIGIN}${item.fileUrl}`
                : null;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 line-clamp-2">{item.title}</p>
                  </div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {hasBooks ? (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <BookOpen className="h-4 w-4 text-amber-600" />
            Course books
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {books.map((cb) => {
              const thumbUrl = cb.book.thumbnailUrl
                ? resolveAttachmentUrl(cb.book.thumbnailUrl, API_ORIGIN)
                : null;
              return (
                <div
                  key={cb.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4"
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={cb.book.name}
                      className="h-20 w-14 shrink-0 rounded-md border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-md bg-amber-50">
                      <BookOpen className="h-6 w-6 text-amber-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 line-clamp-2">{cb.book.name}</p>
                    {cb.book.author ? (
                      <p className="mt-0.5 text-xs text-slate-500">{cb.book.author}</p>
                    ) : null}
                    <div className="mt-2">
                      {cb.isFree ? (
                        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Included
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">See course materials</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {hasFeatures ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">What&apos;s included</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3"
              >
                {f.icon ? <span className="text-xl shrink-0">{f.icon}</span> : null}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {f.label}
                  </p>
                  <p className="font-medium text-slate-900 truncate">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {course.description ? (
        <section className="space-y-2 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-semibold text-slate-800">About this course</h3>
          <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
        </section>
      ) : null}
    </div>
  );
}
