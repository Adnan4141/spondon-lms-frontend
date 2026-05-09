'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import {
  getFinancialDashboard,
  getMyBookPurchases,
  getMyCourses,
  getStudentResults,
  type FinancialDashboardData,
} from '@/lib/api/student-portal';
import { getStudentExams } from '@/lib/api/exams';
import type { MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';
import { StudentDashboardWelcomeBanner } from '@/components/student/dashboard/StudentDashboardWelcomeBanner';
import { StudentDashboardStatsGrid } from '@/components/student/dashboard/StudentDashboardStatsGrid';
import { StudentDashboardBooksSection } from '@/components/student/dashboard/StudentDashboardBooksSection';
import { StudentDashboardRecentCourses } from '@/components/student/dashboard/StudentDashboardRecentCourses';
import { StudentDashboardAside } from '@/components/student/dashboard/StudentDashboardAside';
import { countResultRows } from '@/components/student/dashboard/count-result-rows';
import type { DashboardStats, MyCourseRow } from '@/components/student/dashboard/types';
import {
  flatStudentCoursesToMyCourseRows,
  flattenEnrollmentCoursesForStudent,
} from '@/lib/student-my-courses';

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
  const [dueInvoices, setDueInvoices] = useState<FinancialDashboardData['paymentHistory']>([]);
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
          void getFinancialDashboard(id).then((financialRes) => {
            if (financialRes.success && financialRes.data) {
              setDueInvoices(
                financialRes.data.paymentHistory
                  .filter((invoice) => Number(invoice.dueAmount) > 0 && invoice.status !== 'CANCELLED')
                  .slice(0, 3),
              );
            }
          }).catch(() => {
            setDueInvoices([]);
          });

          if (coursesRes.success && coursesRes.data) {
            const flat = flattenEnrollmentCoursesForStudent(coursesRes.data);
            const rows = flatStudentCoursesToMyCourseRows(flat);
            setMyCoursesList(rows);
            setStats((s) => ({ ...s, myCourses: flat.length }));
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
      {dueInvoices.length > 0 && (
        <div className="rounded-[2rem] border border-amber-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">বকেয়া ইনভয়েস</p>
                <p className="text-sm font-semibold text-slate-500">
                  {dueInvoices.length}টি ইনভয়েসে পেমেন্ট বাকি আছে
                </p>
              </div>
            </div>
            <Link
              href="/student/payment"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white transition-colors hover:bg-indigo-700"
            >
              Pay Now
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {dueInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href="/student/payment"
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
              >
                <p className="truncate text-sm font-black text-slate-900">
                  {invoice.month ? `${invoice.month} invoice` : 'One-time invoice'}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {invoice.items.map((item) => item.title).join(', ') || 'Invoice'}
                </p>
                <p className="mt-2 text-lg font-black text-rose-600">৳{invoice.dueAmount}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
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
