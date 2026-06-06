'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { DueSummaryRow, EnrollmentReportData, RevenueSummaryData } from '@/lib/api/reports';

const chartColors = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

function money(value: number) {
  return `৳${Math.round(Number(value || 0)).toLocaleString()}`;
}

function count(value: number) {
  return Math.round(Number(value || 0)).toLocaleString();
}

export interface AdminDashboardChartsProps {
  loading: boolean;
  revenue: RevenueSummaryData[];
  dueTotals: { totalPayable: number; totalPaid: number; totalDue: number };
  topCourses: EnrollmentReportData[];
  topDueBranches: DueSummaryRow[];
  collectionData: { name: string; value: number }[];
}

export default function AdminDashboardCharts({
  loading,
  revenue,
  dueTotals,
  topCourses,
  topDueBranches,
  collectionData,
}: AdminDashboardChartsProps) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Actual collected payments by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => money(value)} />
                    <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
                  {loading ? 'Loading revenue...' : 'No revenue data yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collection Health</CardTitle>
            <CardDescription>Collected vs outstanding invoice amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
              <div className="h-48">
                {collectionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={collectionData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                        {collectionData.map((_, index) => (
                          <Cell key={index} fill={index === 0 ? '#059669' : '#dc2626'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
                    No invoice totals
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Payable', value: dueTotals.totalPayable, color: 'text-slate-900' },
                  { label: 'Collected', value: dueTotals.totalPaid, color: 'text-emerald-700' },
                  { label: 'Due', value: dueTotals.totalDue, color: 'text-rose-700' },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                    <p className={`text-lg font-black ${row.color}`}>{money(row.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-xl border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Enrolled Courses</CardTitle>
            <CardDescription>Course demand by active enrollment count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {topCourses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCourses} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="courseName"
                      width={140}
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip formatter={(value: number) => count(value)} />
                    <Bar dataKey="enrollmentCount" radius={[0, 8, 8, 0]}>
                      {topCourses.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
                  {loading ? 'Loading enrollments...' : 'No enrollment data yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Branch Dues</CardTitle>
            <CardDescription>Branches with highest outstanding amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDueBranches.length > 0 ? topDueBranches.map((row, index) => {
              const pct = dueTotals.totalDue > 0 ? Math.min(100, Math.round((row.totalDue / dueTotals.totalDue) * 100)) : 0;
              return (
                <div key={row.branchId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-bold text-slate-800">{row.branchName}</p>
                    <p className="shrink-0 text-sm font-black text-rose-700">{money(row.totalDue)}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: chartColors[index % chartColors.length] }} />
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
                No branch due data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
