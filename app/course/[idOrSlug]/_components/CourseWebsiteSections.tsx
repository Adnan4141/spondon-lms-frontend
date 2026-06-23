import { Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseWebsiteSection } from '@/types/course';

type Props = {
  sections: CourseWebsiteSection[];
};

export function CourseWebsiteSections({ sections }: Props) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((sec) => (
        <section key={sec.id} className="space-y-6">
          {sec.title.trim() ? (
            <div className="mb-2 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
                <Layout size={22} className="text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">সিলেবাস ও বিবরণ</span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">{sec.title}</h2>
              </div>
            </div>
          ) : null}
          {sec.bodyHtml?.trim() ? (
            <div
              className={cn(
                'prose prose-slate prose-lg max-w-none rounded-[32px] border border-slate-100 bg-white p-8 md:p-10 shadow-xs transition-shadow duration-300 hover:shadow-md',
                '[&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-100 [&_img]:shadow-xs',
                '[&_a]:text-indigo-600 [&_a]:font-bold hover:[&_a]:text-indigo-700',
                '[&_ul]:list-disc [&_ol]:list-decimal [&_li]:leading-relaxed [&_li]:text-slate-650'
              )}
              dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
            />
          ) : null}
        </section>
      ))}
    </>
  );
}
