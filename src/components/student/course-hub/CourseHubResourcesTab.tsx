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

  if (!hasSyllabus && !hasBooks && !hasFeatures && !course.description) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-12 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">No resources available</p>
        <p className="mt-1 text-xs text-slate-400">Content will appear here once uploaded by your teachers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasSyllabus ? (
        <section className="space-y-3.5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <FileText className="h-4 w-4" />
            </span>
            Syllabus & Course Plans
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {syllabusItems.map((item) => {
              const url = item.fileUrl
                ? item.fileUrl.startsWith('http')
                  ? item.fileUrl
                  : `${API_ORIGIN}${item.fileUrl}`
                : null;
              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">{item.title}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">PDF Document</p>
                  </div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-500/15"
                    >
                      <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-y-[0.5px]" />
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
        <section className="space-y-3.5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <BookOpen className="h-4 w-4" />
            </span>
            Course Books
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {books.map((cb) => {
              const thumbUrl = cb.book.thumbnailUrl
                ? resolveAttachmentUrl(cb.book.thumbnailUrl, API_ORIGIN)
                : null;
              return (
                <div
                  key={cb.id}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5"
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={cb.book.name}
                      className="h-24 w-18 shrink-0 rounded-lg border border-slate-200/60 object-cover shadow-[3px_3px_10px_rgba(0,0,0,0.06)] transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-24 w-18 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-500 shadow-inner">
                      <BookOpen className="h-7 w-7 text-amber-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 flex flex-col h-24 justify-between py-0.5">
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">{cb.book.name}</p>
                      {cb.book.author ? (
                        <p className="mt-1 text-xs font-semibold text-slate-400">{cb.book.author}</p>
                      ) : null}
                    </div>
                    <div>
                      {cb.isFree ? (
                        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
                          Included Free
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Course Material</span>
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
        <section className="space-y-3.5">
          <h3 className="text-sm font-bold text-slate-800">What&apos;s Included</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-indigo-100 transition-colors"
              >
                {f.icon ? (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl shadow-inner">
                    {f.icon}
                  </span>
                ) : null}
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {f.label}
                  </p>
                  <p className="font-extrabold text-slate-800 truncate mt-0.5">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {course.description ? (
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-800">About This Course</h3>
          <p className="text-sm leading-relaxed font-semibold text-slate-500 whitespace-pre-line">{course.description}</p>
        </section>
      ) : null}
    </div>
  );
}
