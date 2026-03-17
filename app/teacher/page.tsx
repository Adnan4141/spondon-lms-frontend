'use client';

import { BookOpen, ClipboardList, FileQuestion, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage courses, exams, and students</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/teacher/courses">
          <Card className="rounded-2xl border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                My Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-600">Manage course content</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/exams">
          <Card className="rounded-2xl border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-600">Create & manage exams</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/questions">
          <Card className="rounded-2xl border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-amber-500" />
                Question Bank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-600">Upload & manage questions</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/doubts">
          <Card className="rounded-2xl border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                Doubts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-600">Answer student doubts</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
