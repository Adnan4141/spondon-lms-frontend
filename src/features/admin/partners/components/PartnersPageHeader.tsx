import { Building2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PartnersPageHeaderProps = {
  loading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onAddPartner: () => void;
};

export function PartnersPageHeader({
  loading,
  isFetching,
  onRefresh,
  onAddPartner,
}: PartnersPageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
          <Building2 className="h-3 w-3" />
          Homepage · Partners
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Partners</h1>
        <p className="mt-1 font-medium text-slate-500">
          Manage logos and links for the <strong>Trusted by</strong> section on the public home page.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 shadow-sm transition-all hover:bg-slate-50"
          onClick={onRefresh}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', (loading || isFetching) && 'animate-spin')} /> Refresh
        </Button>
        <Button
          className="h-12 rounded-2xl bg-indigo-600 px-6 font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700"
          onClick={onAddPartner}
        >
          <Plus className="mr-2 h-4 w-4" /> Add partner
        </Button>
      </div>
    </header>
  );
}
