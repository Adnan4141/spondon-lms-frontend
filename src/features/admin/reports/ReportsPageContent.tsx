'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAdminFilterOptions } from '@/lib/query/hooks/useAdminFilterOptions';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { getSourceBranchOptions } from '@/features/admin/accounting/branchSourceUtils';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Building2,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { type TabKey, type BranchOption } from './shared';

const FinanceTab = dynamic(() => import('./tabs/FinanceTab').then((m) => m.FinanceTab), {
  loading: () => <TabLoading />,
});
const EnrollmentTab = dynamic(() => import('./tabs/EnrollmentTab').then((m) => m.EnrollmentTab), {
  loading: () => <TabLoading />,
});
const CourseTransactionsTab = dynamic(() => import('./tabs/CourseTransactionsTab').then((m) => m.CourseTransactionsTab), {
  loading: () => <TabLoading />,
});
const BookSalesTab = dynamic(() => import('./tabs/BookSalesTab').then((m) => m.BookSalesTab), {
  loading: () => <TabLoading />,
});
const DueCollectionTab = dynamic(() => import('./tabs/DueCollectionTab').then((m) => m.DueCollectionTab), {
  loading: () => <TabLoading />,
});
const LedgerSummaryTab = dynamic(() => import('./tabs/LedgerSummaryTab').then((m) => m.LedgerSummaryTab), {
  loading: () => <TabLoading />,
});

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
    </div>
  );
}

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'finance', label: 'Finance Dashboard', icon: TrendingUp },
  { key: 'enrollment', label: 'Enrollment Report', icon: Users },
  { key: 'course-transactions', label: 'Course Transactions', icon: BarChart3 },
  { key: 'book-sales', label: 'Book Sales & Stock', icon: BookOpen },
  { key: 'due-collection', label: 'Due Collection', icon: Building2 },
  { key: 'ledger', label: 'Ledger Summary', icon: Wallet },
];

export function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();
  const { user } = useAdminSession();
  const {
    branches,
    namedCourses: courses,
    namedPrograms: programs,
    isMetaLoading: metaLoading,
  } = useAdminFilterOptions();

  const [activeTab, setActiveTab] = useState<TabKey>((searchParams?.get('tab') as TabKey) ?? 'finance');

  const visibleBranches = user?.role === 'BRANCH_ADMIN' && user.branchId
    ? branches.filter((branch) => branch.id === user.branchId)
    : branches;

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    router.replace(`/admin/reports?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="min-h-screen space-y-6 p-6 bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">Finance, enrollment, inventory, and ledger data</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {metaLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      ) : (
        <div>
          {activeTab === 'finance' && <FinanceTab branches={visibleBranches} courses={courses} programs={programs} />}
          {activeTab === 'enrollment' && <EnrollmentTab branches={visibleBranches} courses={courses} programs={programs} />}
          {activeTab === 'course-transactions' && (
            <CourseTransactionsTab courses={courses} branches={visibleBranches} />
          )}
          {activeTab === 'book-sales' && <BookSalesTab branches={visibleBranches} />}
          {activeTab === 'due-collection' && <DueCollectionTab branches={visibleBranches} />}
          {activeTab === 'ledger' && <LedgerSummaryTab branches={visibleBranches} />}
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
