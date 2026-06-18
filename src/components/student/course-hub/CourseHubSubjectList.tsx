import { BookOpen, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SubjectRow } from './course-hub-types';
import { CourseHubSubjectListItem } from './CourseHubSubjectListItem';

type Props = {
  subjects: SubjectRow[];
  courseRouteId: string;
};

export function CourseHubSubjectList({ subjects, courseRouteId }: Props) {
  if (subjects.length === 0) {
    return (
      <Card className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
        <CardContent className="p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No subjects yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Content will appear here once your teachers add lessons.
          </p>
        </CardContent>
      </Card>
    );
  }

  const featuredId =
    subjects.find((s) => s.stats.progressPct > 0 && s.stats.progressPct < 100)?.slug ??
    subjects[0]?.slug;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Layers className="h-4 w-4 text-indigo-500" />
          Subjects
        </h2>
        <span className="text-xs font-medium text-slate-400">{subjects.length} total</span>
      </div>

      {subjects.map((row, index) => (
        <CourseHubSubjectListItem
          key={row.slug}
          row={row}
          href={`/student/courses/${courseRouteId}/${row.slug}`}
          featured={row.slug === featuredId && subjects.length > 1}
          colorIndex={index}
        />
      ))}
    </div>
  );
}
