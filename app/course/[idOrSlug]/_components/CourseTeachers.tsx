import Image from 'next/image';
import { UserCircle } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import type { CourseDetails } from '@/types/course';

type Props = {
  teachers: NonNullable<CourseDetails['teachers']>;
  title: string;
};

export function CourseTeachers({ teachers, title }: Props) {
  return (
    <section>
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
          <UserCircle size={24} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((ct) => {
          const t = ct.teacher;
          if (!t) return null;
          const imgSrc = t.profileImage
            ? resolveAttachmentUrl(t.profileImage, API_ORIGIN)
            : null;
          return (
            <div
              key={ct.id}
              className="group flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-white p-6 text-center transition-all hover:shadow-lg"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-md">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={t.fullName}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-base font-black leading-tight text-slate-900">{t.fullName}</p>
                {t.designation && (
                  <p className="mt-0.5 text-xs font-bold text-indigo-600">{t.designation}</p>
                )}
                {t.institute && (
                  <p className="mt-0.5 text-xs font-medium text-slate-400">{t.institute}</p>
                )}
                {t.experienceYears != null && (
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t.experienceYears} বছরের অভিজ্ঞতা
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
