'use client';

import { useEffect, useState } from 'react';
import { getMyCourses, getMyBookPurchases, getStudentResults } from '@/lib/api/student-portal';
import { getStudentExams } from '@/lib/api/exams';
import type { MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';
import { StudentDashboardWelcomeBanner } from '@/components/student/dashboard/StudentDashboardWelcomeBanner';
import { StudentDashboardStatsGrid } from '@/components/student/dashboard/StudentDashboardStatsGrid';
import { StudentDashboardBooksSection } from '@/components/student/dashboard/StudentDashboardBooksSection';
import { StudentDashboardRecentCourses } from '@/components/student/dashboard/StudentDashboardRecentCourses';
import { StudentDashboardAside } from '@/components/student/dashboard/StudentDashboardAside';
import { countResultRows } from '@/components/student/dashboard/count-result-rows';
import type { DashboardStats, MyCourseRow } from '@/components/student/dashboard/types';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    myCourses: 0,
    myBooks: 0,
    myExams: 0,
    results: 0,
  });
  const [user, setUser] = useState<{ fullName?: string; id?: string } | null>(null);
  const [myPurchases, setMyPurchases] = useState<MyBookPurchaseRow[]>([]);
  const [myCoursesList, setMyCoursesList] = useState<MyCourseRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!u) {
      setPurchasesLoading(false);
      setCoursesLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(u) as { id?: string; fullName?: string };
      setUser(parsed);
      const id = parsed?.id;
      if (!id) {
        setPurchasesLoading(false);
        setCoursesLoading(false);
        return;
      }

      (async () => {
        try {
          const [coursesRes, booksRes, examsRes, resultsRes] = await Promise.all([
            getMyCourses(id),
            getMyBookPurchases(id),
            getStudentExams(id),
            getStudentResults(id),
          ]);

          if (coursesRes.success && coursesRes.data) {
            const rows = coursesRes.data as MyCourseRow[];
            setMyCoursesList(rows);
            setStats((s) => ({ ...s, myCourses: rows.length }));
          }

          if (booksRes.success && booksRes.data) {
            setMyPurchases(booksRes.data);
            setStats((s) => ({ ...s, myBooks: booksRes.data!.length }));
          }

          if (examsRes.success && examsRes.data) {
            setStats((s) => ({ ...s, myExams: examsRes.data!.length }));
          }

          if (resultsRes.success && resultsRes.data) {
            setStats((s) => ({ ...s, results: countResultRows(resultsRes.data!) }));
          }
        } catch {
          /* ignore */
        } finally {
          setPurchasesLoading(false);
          setCoursesLoading(false);
        }
      })();
    } catch {
      setPurchasesLoading(false);
      setCoursesLoading(false);
    }
  }, []);

  const userName = user?.fullName || 'শিক্ষার্থী';
  const courseCards = myCoursesList.slice(0, 3);

  return (
    <div className="space-y-10">
      <StudentDashboardWelcomeBanner userName={userName} />
      <StudentDashboardStatsGrid stats={stats} />
      <StudentDashboardBooksSection purchases={myPurchases} loading={purchasesLoading} />
      <div className="grid gap-8 lg:grid-cols-3">
        <StudentDashboardRecentCourses
          loading={coursesLoading}
          courseCount={stats.myCourses}
          courses={courseCards}
        />
        <StudentDashboardAside />
      </div>
    </div>
  );
}
