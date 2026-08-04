import { BookOpen, FileText, Check } from 'lucide-react';
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
    <section className="space-y-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-100">
          <FileText size={22} className="text-white" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">প্রস্তুতির সহায়ক বইসমূহ</span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs font-semibold text-slate-500 leading-normal">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className={cn(
        "grid gap-4 sm:grid-cols-2",
        courseBooks.length === 1 && "sm:grid-cols-1 lg:grid-cols-1 max-w-[380px]"
      )}>
        {courseBooks.map((cb) => {
          const isSelected = selectedPaidBookIds.includes(cb.bookId);
          return (
            <label
              key={cb.id}
              className={cn(
                'relative flex cursor-pointer items-center gap-4 rounded-3xl border bg-white p-5 transition-all duration-300 select-none hover:shadow-lg',
                cb.isFree
                  ? 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/5'
                  : isSelected
                    ? 'border-amber-400 bg-amber-50/10 ring-1 ring-amber-400/30'
                    : 'border-slate-100 hover:border-amber-200 hover:bg-amber-50/5'
              )}
            >
              {/* Checkbox indicator */}
              <div className="shrink-0 flex items-center justify-center">
                {!cb.isFree ? (
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isSelected}
                      onChange={() => togglePaidBook(cb.bookId)}
                    />
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border transition-all duration-200',
                      isSelected 
                        ? 'border-amber-500 bg-amber-500 text-white' 
                        : 'border-slate-300 bg-white hover:border-amber-500'
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded border border-emerald-200 bg-emerald-55 text-emerald-600">
                    <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                  </div>
                )}
              </div>

              {/* Book Thumbnail container with 3D shadow and depth effect */}
              <div className="relative h-22 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-100 shadow-md transition-transform duration-350 hover:scale-103">
                {/* Book Spine highlight */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/25 z-10" />
                
                {cb.book.thumbnailUrl ? (
                  <img
                    src={cb.book.thumbnailUrl}
                    alt={cb.book.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate font-extrabold text-slate-800 text-sm group-hover:text-slate-900">
                  {cb.book.name}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                    cb.book.isEbook 
                      ? "bg-blue-50 text-blue-700 border border-blue-100/40" 
                      : "bg-orange-50 text-orange-700 border border-orange-100/40"
                  )}>
                    {cb.book.isEbook ? 'ই-বুক' : 'প্রিন্ট সংস্করণ'}
                  </span>
                  
                  {cb.isFree ? (
                    <span className="text-[10px] font-black text-emerald-600">
                      • কোর্সের সাথে ফ্রি
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-amber-700">
                      • ৳{Number(cb.book.price).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
