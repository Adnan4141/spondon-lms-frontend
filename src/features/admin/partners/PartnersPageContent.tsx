'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { usePartnerDetail } from '@/lib/query/hooks/usePartnerDetail';
import { usePartnerRevenueSummary } from '@/lib/query/hooks/usePartnerRevenueSummary';
import { PartnerDetailDialog } from './components/PartnerDetailDialog';
import { PartnerRevenueDialog } from './components/PartnerRevenueDialog';
import { PartnersPageHeader } from './components/PartnersPageHeader';
import { PartnersStatsGrid } from './components/PartnersStatsGrid';
import { PartnersTable } from './components/PartnersTable';
import { usePartnerPageActions } from './hooks/usePartnerPageActions';
import { usePartnersPageData } from './hooks/usePartnersPageData';
import { computePartnerStats, filterPartnersByQuery } from './partners-page-utils';

export function PartnersPageContent() {
  const { toasts, removeToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const { partners, loading, isFetching, refetch, invalidatePartners } = usePartnersPageData();

  const {
    togglingId,
    revenuePartner,
    showRevenueDialog,
    setShowRevenueDialog,
    detailPartner,
    showDetailDialog,
    closePartnerDetails,
    openForm,
    remove,
    openPartnerDetails,
    openLinkedCourse,
    openLinkedBook,
    toggleActive,
    openRevenueDialog,
  } = usePartnerPageActions({ invalidatePartners });

  const { data: refreshedDetail, isFetching: detailLoading } = usePartnerDetail(
    detailPartner?.id,
    showDetailDialog,
  );
  const displayPartner = refreshedDetail ?? detailPartner;

  const { data: revenueSummary, isFetching: revenueLoading } = usePartnerRevenueSummary(
    revenuePartner?.id,
    showRevenueDialog,
  );

  const filteredPartners = useMemo(
    () => filterPartnersByQuery(partners, searchQuery),
    [partners, searchQuery],
  );
  const stats = useMemo(() => computePartnerStats(partners), [partners]);

  return (
    <div className="space-y-10 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <PartnersPageHeader
        loading={loading}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        onAddPartner={() => openForm()}
      />

      <PartnersStatsGrid total={stats.total} visible={stats.visible} hidden={stats.hidden} />

      <PartnersTable
        loading={loading}
        partners={filteredPartners}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        togglingId={togglingId}
        onRowClick={openPartnerDetails}
        onToggleActive={(partner, next) => void toggleActive(partner, next)}
        onEdit={openForm}
        onDelete={remove}
        onRevenue={openRevenueDialog}
      />

      <PartnerDetailDialog
        open={showDetailDialog}
        partner={displayPartner}
        loading={detailLoading}
        onOpenChange={closePartnerDetails}
        onOpenCourse={(id) => void openLinkedCourse(id)}
        onOpenBook={(id) => void openLinkedBook(id)}
      />

      <PartnerRevenueDialog
        open={showRevenueDialog}
        partner={revenuePartner}
        summary={revenueSummary}
        loading={revenueLoading}
        onOpenChange={setShowRevenueDialog}
      />
    </div>
  );
}
