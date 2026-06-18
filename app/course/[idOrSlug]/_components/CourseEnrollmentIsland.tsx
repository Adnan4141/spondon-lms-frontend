'use client';

import type { ReactNode } from 'react';
import { useCourseInitialData } from '@/components/course/CourseInitialDataContext';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { CoursePageDisplay } from '../_lib/course-page-display';
import { useCourseEnrollment } from '../_hooks/useCourseEnrollment';
import { CourseBooks } from './CourseBooks';
import { CourseSidebar } from './CourseSidebar';
import { CheckoutDialog } from './CheckoutDialog';

type Props = {
  idOrSlug: string;
  display: CoursePageDisplay;
  children: ReactNode;
};

export function CourseEnrollmentIsland({ idOrSlug, display, children }: Props) {
  const course = useCourseInitialData();
  const { toasts, removeToast } = useToast();
  const enrollment = useCourseEnrollment(course, idOrSlug);

  if (!course) return null;
  const { publicPage } = display;

  return (
    <>
      <Toaster toasts={toasts} removeToast={removeToast} />
      <div
        className={cn('grid gap-16', publicPage.showSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-1')}
      >
        <div className={cn('space-y-16', publicPage.showSidebar ? 'lg:col-span-2' : '')}>
          {children}

          {publicPage.showBooks && enrollment.courseBooks.length > 0 ? (
            <CourseBooks
              courseBooks={enrollment.courseBooks}
              selectedPaidBookIds={enrollment.selectedPaidBookIds}
              togglePaidBook={enrollment.togglePaidBook}
              title={display.booksSectionTitle}
              subtitle={display.booksSectionSubtitle}
            />
          ) : null}
        </div>

        {publicPage.showSidebar ? (
          <CourseSidebar
            course={course}
            sidebarFeaturesCustom={display.sidebarFeaturesCustom}
            sidebarCardTitle={display.sidebarCardTitle}
            enrollTotal={enrollment.enrollTotal}
            effectiveCourseFee={enrollment.effectiveCourseFee}
            booksAddonTotal={enrollment.booksAddonTotal}
            offlineBatches={enrollment.offlineBatches}
            selectedBatchId={enrollment.selectedBatchId}
            setSelectedBatchId={enrollment.setSelectedBatchId}
            alreadyEnrolled={enrollment.alreadyEnrolled}
            enrolling={enrollment.enrolling}
            handleEnrollClick={enrollment.handleEnrollClick}
            loading={false}
          />
        ) : null}
      </div>

      <CheckoutDialog
        open={enrollment.checkoutOpen}
        onOpenChange={enrollment.setCheckoutOpen}
        course={course}
        checkoutCourseFee={enrollment.checkoutCourseFee}
        checkoutBooksTotal={enrollment.checkoutBooksTotal}
        checkoutAdmissionFee={enrollment.checkoutAdmissionFee}
        checkoutTotal={enrollment.checkoutTotal}
        checkoutBillingType={enrollment.checkoutQuote?.billingType}
        checkoutBillingMonth={enrollment.checkoutQuote?.billingMonth}
        courseBooks={enrollment.courseBooks}
        selectedPaidBooks={enrollment.selectedPaidBooks}
        selectedPaidBookIds={enrollment.selectedPaidBookIds}
        setPaidBookIncluded={enrollment.setPaidBookIncluded}
        offlineBatches={enrollment.offlineBatches}
        offlineBranches={enrollment.offlineBranches}
        lockedBranch={enrollment.savedBranch}
        branchLocked={Boolean(enrollment.savedBranch)}
        selectedBranchId={enrollment.selectedBranchId}
        setSelectedBranchId={(branchId) => {
          enrollment.setSelectedBranchId(branchId);
          enrollment.setSelectedBatchId('');
        }}
        batchesLoading={enrollment.branchProfileLoading}
        selectedBatchId={enrollment.selectedBatchId}
        setSelectedBatchId={enrollment.setSelectedBatchId}
        selectedBatch={enrollment.selectedBatch}
        needsDelivery={enrollment.needsDelivery}
        delivery={enrollment.delivery}
        setDelivery={enrollment.setDelivery}
        enrolling={enrollment.enrolling}
        quoteLoading={enrollment.quoteLoading}
        quoteError={enrollment.quoteError}
        submitDeliveryAndEnroll={enrollment.submitDeliveryAndEnroll}
      />
    </>
  );
}
