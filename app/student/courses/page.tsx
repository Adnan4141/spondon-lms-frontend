'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function StudentMyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    // TODO: getMyCourses(studentUserId) from API
    setCourses([]);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">My Courses</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <Card className="rounded-2xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-500">No enrolled courses yet</p>
            <p className="text-sm text-slate-400 mt-1">Browse and enroll in courses</p>
          </Card>
        ) : (
          courses.map((c) => (
            <Card key={c.id} className="rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-black text-slate-800">{c.course?.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{c.batch?.name}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
