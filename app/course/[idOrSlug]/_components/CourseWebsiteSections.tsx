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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg shadow-slate-200">
                <Layout size={24} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{sec.title}</h2>
            </div>
          ) : null}
          {sec.bodyHtml?.trim() ? (
            <div
              className={cn(
                'prose prose-slate prose-lg max-w-none rounded-3xl border border-slate-100 bg-white p-8',
                '[&_img]:rounded-xl [&_img]:border [&_img]:border-slate-100'
              )}
              dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
            />
          ) : null}
        </section>
      ))}
    </>
  );
}
