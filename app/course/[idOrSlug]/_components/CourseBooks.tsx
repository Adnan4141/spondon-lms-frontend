import { BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseDetailCourseBook } from '@/types/course';

type Props = {
  courseBooks: CourseDetailCourseBook[];
  selectedPaidBookIds: string[];
  togglePaidBook: (bookId: string) => void;
  title: string;
  subtitle: string;
};

export function CourseBooks({ courseBooks, selectedPaidBookIds, togglePaidBook, title, subtitle }: Props) {
  return (
    <section>
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100">
          <FileText size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {courseBooks.map((cb) => (
          <label
            key={cb.id}
            className={cn(
              'flex cursor-pointer items-center gap-4 rounded-3xl border bg-white p-5 transition-colors',
              cb.isFree
                ? 'border-slate-100 hover:border-amber-100'
                : selectedPaidBookIds.includes(cb.bookId)
                  ? 'border-amber-400 ring-1 ring-amber-200'
                  : 'border-slate-100 hover:border-amber-100'
            )}
          >
            {!cb.isFree ? (
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                checked={selectedPaidBookIds.includes(cb.bookId)}
                onChange={() => togglePaidBook(cb.bookId)}
              />
            ) : (
              <span className="h-5 w-5 shrink-0 rounded border border-emerald-200 bg-emerald-50" />
            )}
            {cb.book.thumbnailUrl ? (
              <img
                src={cb.book.thumbnailUrl}
                alt=""
                className="h-20 w-14 rounded-xl border border-slate-100 object-cover"
              />
            ) : (
              <div className="flex h-20 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-slate-900">{cb.book.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {cb.book.isEbook ? 'ই-বুক' : 'প্রিন্ট'}{' '}
                {cb.isFree ? (
                  <span className="text-emerald-600">· বিনামূল্যে (কোর্সে)</span>
                ) : (
                  <span className="text-amber-700">· ৳{Number(cb.book.price).toLocaleString()}</span>
                )}
              </p>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
