'use client';

import { useState, useEffect } from 'react';
import {
  getRevenueSummary,
  getEnrollmentReport,
  getCourseTransactions,
  type RevenueSummaryParams,
  type EnrollmentReportParams,
} from '@/lib/api/reports';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getPrograms } from '@/lib/api/programs';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { Program } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  RefreshCw,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

type ReportType = 'revenue' | 'enrollment' | 'course-transactions';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function ReportsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [activeReport, setActiveReport] = useState<ReportType>('revenue');
  const [loading, setLoading] = useState(false);

  // Data
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueTotals, setRevenueTotals] = useState({ totalAmount: 0, totalTransactions: 0 });
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [courseTransactionData, setCourseTransactionData] = useState<any[]>([]);

  // Filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Revenue filters
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [revenueBranchId, setRevenueBranchId] = useState<string>('all');
  const [revenueCourseId, setRevenueCourseId] = useState<string>('all');
  const [revenueFrom, setRevenueFrom] = useState<string>('');
  const [revenueTo, setRevenueTo] = useState<string>('');

  // Enrollment filters
  const [enrollmentProgramId, setEnrollmentProgramId] = useState<string>('all');
  const [enrollmentCourseId, setEnrollmentCourseId] = useState<string>('all');
  const [enrollmentBranchId, setEnrollmentBranchId] = useState<string>('all');

  // Course transaction filters
  const [transactionCourseId, setTransactionCourseId] = useState<string>('');

  useEffect(() => {
    loadCourses();
    loadBranches();
    loadPrograms();
  }, []);

  useEffect(() => {
    if (activeReport === 'revenue') {
      loadRevenueReport();
    } else if (activeReport === 'enrollment') {
      loadEnrollmentReport();
    }
  }, [activeReport, revenuePeriod, revenueBranchId, revenueCourseId, revenueFrom, revenueTo, enrollmentProgramId, enrollmentCourseId, enrollmentBranchId]);

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) {
        setCourses(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await getPrograms();
      if (response.success && response.data) {
        setPrograms(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load programs:', err);
    }
  };

  const loadRevenueReport = async () => {
    try {
      setLoading(true);
      const params: RevenueSummaryParams = {
        period: revenuePeriod,
      };
      if (revenueBranchId !== 'all') params.branchId = revenueBranchId;
      if (revenueCourseId !== 'all') params.courseId = revenueCourseId;
      if (revenueFrom) params.from = revenueFrom;
      if (revenueTo) params.to = revenueTo;

      const response = await getRevenueSummary(params);
      if (response.success) {
        setRevenueData(response.data || []);
        setRevenueTotals(response.totals || { totalAmount: 0, totalTransactions: 0 });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load revenue report',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load revenue report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentReport = async () => {
    try {
      setLoading(true);
      const params: EnrollmentReportParams = {};
      if (enrollmentProgramId !== 'all') params.programId = enrollmentProgramId;
      if (enrollmentCourseId !== 'all') params.courseId = enrollmentCourseId;
      if (enrollmentBranchId !== 'all') params.branchId = enrollmentBranchId;

      const response = await getEnrollmentReport(params);
      if (response.success) {
        setEnrollmentData(response.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load enrollment report',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load enrollment report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourseTransactions = async () => {
    if (!transactionCourseId) {
      toast({
        title: 'Error',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await getCourseTransactions({ courseId: transactionCourseId });
      if (response.success) {
        setCourseTransactionData(response.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load course transactions',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load course transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (revenuePeriod === 'yearly') {
      return date.getFullYear().toString();
    } else if (revenuePeriod === 'monthly') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const renderRevenueReport = () => (
    <div className="space-y-6">
      <div className="glass-panel p-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Select value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as 'daily' | 'monthly' | 'yearly')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Branch</label>
            <Select value={revenueBranchId} onValueChange={setRevenueBranchId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <Select value={revenueCourseId} onValueChange={setRevenueCourseId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Input
              type="date"
              value={revenueFrom}
              onChange={(e) => setRevenueFrom(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Input
              type="date"
              value={revenueTo}
              onChange={(e) => setRevenueTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadRevenueReport} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-5 w-5" />
            <p className="text-sm font-medium">Total Revenue</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(revenueTotals.totalAmount)}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
            <p className="text-sm font-medium">Total Transactions</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{revenueTotals.totalTransactions}</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="text-base font-semibold">Revenue Summary</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading revenue data...</div>
        ) : revenueData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No revenue data found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>
                  {revenuePeriod === 'yearly' ? 'Year' : revenuePeriod === 'monthly' ? 'Month' : 'Date'}
                </TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueData.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.bucket}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  const renderEnrollmentReport = () => {
    const totalEnrollments = enrollmentData.reduce((sum, item) => sum + item.enrollmentCount, 0);
    const totalPayable = enrollmentData.reduce((sum, item) => sum + item.estimatedPayable, 0);

    return (
      <div className="space-y-6">
        <div className="glass-panel p-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program</label>
              <Select value={enrollmentProgramId} onValueChange={setEnrollmentProgramId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select value={enrollmentCourseId} onValueChange={setEnrollmentCourseId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <Select value={enrollmentBranchId} onValueChange={setEnrollmentBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadEnrollmentReport} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <p className="text-sm font-medium">Total Enrollments</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{totalEnrollments}</p>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm font-medium">Total Estimated Payable</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalPayable)}</p>
          </div>
        </div>

        <div className="glass-panel overflow-hidden p-0">
          <div className="border-b border-border/60 px-5 py-4">
            <h3 className="text-base font-semibold">Enrollment Report</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading enrollment data...</div>
          ) : enrollmentData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No enrollment data found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Program</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Enrollments</TableHead>
                  <TableHead className="text-right">Per Student Pay</TableHead>
                  <TableHead className="text-right">Estimated Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.programName}</TableCell>
                    <TableCell>{item.courseName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{item.enrollmentCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.perStudentPay)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.estimatedPayable)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  };

  const renderCourseTransactions = () => (
    <div className="space-y-6">
      <div className="glass-panel p-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Course *</label>
            <Select value={transactionCourseId} onValueChange={setTransactionCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadCourseTransactions} disabled={loading || !transactionCourseId}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Load Transactions
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="text-base font-semibold">Course Transactions</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
        ) : courseTransactionData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {transactionCourseId ? 'No transactions found for this course' : 'Please select a course to view transactions'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Paid Amount</TableHead>
                <TableHead className="text-right">Due Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseTransactionData.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.student?.fullName || '-'}</TableCell>
                  <TableCell>{transaction.branch?.name || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(transaction.totalAmount))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(transaction.paidAmount))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(transaction.dueAmount))}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === 'PAID'
                          ? 'default'
                          : transaction.status === 'PARTIAL'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Reports & Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View revenue summaries, enrollment reports, and course transaction details.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <section className="glass-panel p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveReport('revenue')}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                activeReport === 'revenue'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Revenue</span>
            </button>
            <button
              onClick={() => setActiveReport('enrollment')}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                activeReport === 'enrollment'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Enrollments</span>
            </button>
            <button
              onClick={() => setActiveReport('course-transactions')}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                activeReport === 'course-transactions'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Transactions</span>
            </button>
          </nav>
        </section>

        <section className="glass-panel p-6">
          {activeReport === 'revenue' && renderRevenueReport()}
          {activeReport === 'enrollment' && renderEnrollmentReport()}
          {activeReport === 'course-transactions' && renderCourseTransactions()}
        </section>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
