import Image from 'next/image';
import { User, Youtube, Linkedin, Globe } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CourseDetails } from '@/types/course';

type Props = {
  teachers: NonNullable<CourseDetails['teachers']>;
  title: string;
};

export function CourseTeachers({ teachers, title }: Props) {
  return (
    <section className="space-y-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
          <User size={22} className="text-white" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">ইনস্ট্রাক্টর প্যানেল</span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">{title}</h2>
        </div>
      </div>

      <div className={cn(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
        teachers.length === 1 && "sm:grid-cols-1 lg:grid-cols-1 max-w-[280px]"
      )}>
        {teachers.map((ct) => {
          const t = ct.teacher;
          if (!t) return null;
          const imgSrc = t.profileImage
            ? resolveAttachmentUrl(t.profileImage, API_ORIGIN)
            : null;
          return (
            <div
              key={ct.id}
              className="group relative flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center transition-all duration-350 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100/80 hover:border-indigo-100/50"
            >
              {/* Profile Image container with glowing ring */}
              <div className="relative mb-4 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-slate-50 p-1 shadow-inner border border-slate-100 transition-all duration-350 group-hover:scale-105 group-hover:border-indigo-200">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={t.fullName}
                    width={96}
                    height={96}
                    className="h-full w-full rounded-[20px] object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-gradient-to-tr from-indigo-50 to-slate-100/50 text-indigo-500">
                    <User className="h-10 w-10 stroke-[1.5]" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 space-y-2">
                <p className="text-base font-extrabold leading-tight text-slate-900 group-hover:text-indigo-650 transition-colors duration-350">
                  {t.fullName}
                </p>
                
                {t.designation && (
                  <span className="inline-flex rounded-full bg-indigo-50/60 px-3 py-1 text-[11px] font-black text-indigo-700 border border-indigo-100/30">
                    {t.designation}
                  </span>
                )}
                
                {t.institute && (
                  <p className="text-xs font-semibold text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                    {t.institute}
                  </p>
                )}

                {t.experienceYears != null && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-50/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 border border-amber-100/40">
                    <span>★ {t.experienceYears} বছরের অভিজ্ঞতা</span>
                  </div>
                )}
              </div>

              {/* Social shortcuts */}
              <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-50 pt-4 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-350">
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all">
                  <Linkedin className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:text-[#FF0000] hover:bg-[#FF0000]/5 transition-all">
                  <Youtube className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                  <Globe className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
