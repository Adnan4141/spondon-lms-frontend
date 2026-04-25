'use client';

import { useEffect, useState } from 'react';
import {
  getBranches,
  getBranchById,
  deleteBranch,
  type Branch,
} from '@/lib/api/branches';
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
  Building2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Calendar,
  GraduationCap,
  Layers,
  ArrowRight,
  Phone,
  MapPin,
  Hash,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { BranchForm } from '@/features/admin/branches';
import { BranchDetailsView } from '@/features/admin/branches';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';

const statusOptions = ['all', 'active', 'inactive'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  if (status.toLowerCase() === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status.toLowerCase() === 'inactive') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export default function BranchesPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Branch | 'order'; direction: 'asc' | 'desc' }>({
    key: 'order',
    direction: 'asc',
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data);
      } else {
        setError(response.message || 'Failed to load branches');
        setBranches([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load branches');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleViewBranch = async (branchId: string) => {
    try {
      const response = await getBranchById(branchId);
      if (response.success && response.data) {
        openModal({
          title: 'Branch Details',
          description: 'View branch info.',
          className: 'sm:max-w-4xl',
          content: <BranchDetailsView branch={response.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load branch data', variant: 'destructive' });
    }
  };

  const handleEditBranch = async (branchId: string) => {
    try {
      const response = await getBranchById(branchId);
      if (response.success && response.data) {
        openModal({
          title: 'Edit Branch',
          description: 'Update branch information.',
          className: 'sm:max-w-2xl',
          content: <BranchForm branch={response.data} onSuccess={loadBranches} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load branch for editing', variant: 'destructive' });
    }
  };

  const handleCreateBranch = () => {
    openModal({
      title: 'Add Branch',
      description: 'Create a new branch.',
      className: 'sm:max-w-2xl',
      content: <BranchForm onSuccess={loadBranches} />,
    });
  };

  const handleDeleteBranch = async (branchId: string) => {
    openModal({
      title: 'Delete Branch',
      description: 'Delete this branch? This cannot be undone.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Remove this branch permanently?"
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteBranch(branchId);
              await loadBranches();
              toast({ title: 'Success', description: 'Branch removed successfully', variant: 'success' });
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };


  const filteredBranches = branches
    .filter(
      (branch) =>
        (branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.address?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === 'all' || branch.status.toLowerCase() === statusFilter.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const toggleSort = (key: keyof Branch | 'order') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search by name, code, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Status' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadBranches}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateBranch}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Branches</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">All branches</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Branches
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading branches...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No branches found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead 
                    className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    Branch {sortConfig.key === 'name' ? `(${sortConfig.direction === 'asc' ? 'asc' : 'desc'})` : ''}
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Contact</TableHead>
                  <TableHead 
                    className="font-black text-[10px] uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => toggleSort('order')}
                  >
                    Order {sortConfig.key === 'order' ? `(${sortConfig.direction === 'asc' ? 'asc' : 'desc'})` : ''}
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-base">
                             {branch.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{branch.name}</span>
                             <span className="text-base font-medium text-slate-400 uppercase tracking-widest">Code: {branch.code || 'N/A'}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <Phone className="h-3.5 w-3.5 text-emerald-500" />
                             {branch.phone || 'No Contact'}
                          </div>
                          <div className="flex items-center gap-1.5 text-base font-medium text-slate-400">
                             <MapPin className="h-3.5 w-3.5 text-rose-400" />
                             <span className="truncate max-w-[200px]">{branch.address || 'No Address'}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs border border-indigo-100">
                          {branch.order || 0}
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-1", getStatusBadgeClass(branch.status))}>
                         {branch.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewBranch(branch.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditBranch(branch.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteBranch(branch.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
