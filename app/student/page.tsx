'use client';

import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState({ myCourses: 0, results: 0 });

  useEffect(() => {
    // TODO: Fetch from API with student user ID from auth
    setStats({ myCourses: 0, results: 0 });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to your learning portal</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-slate-900">{stats.myCourses}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Routine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-600">View class schedule</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-slate-900">{stats.results}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-rose-500" />
              Explore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-600">Browse all courses</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="/student/courses" className="block p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors font-bold">
            My Courses →
          </a>
          <a href="/student/all-courses" className="block p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors font-bold">
            All Courses →
          </a>
          <a href="/student/results" className="block p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors font-bold">
            View Results →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
