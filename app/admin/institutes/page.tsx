'use client';

import { useEffect, useState } from 'react';
import { getInstitutes, addInstituteByEiin, deleteInstitute, type Institute, type InstituteType } from '@/lib/api/institutes';
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
import { Building2, Plus, RefreshCw, Search, Trash2, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';

export default function InstitutesPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eiinModalOpen, setEiinModalOpen] = useState(false);
  const [eiinValue, setEiinValue] = useState('');
  const [eiinName, setEiinName] = useState('');
  const [eiinType, setEiinType] = useState<InstituteType>('SCHOOL');
  const [eiinSubmitting, setEiinSubmitting] = useState(false);

  const loadInstitutes = async () => {
    try {
      setLoading(true);
      const res = await getInstitutes({ limit: 500, type: typeFilter === 'all' ? undefined : typeFilter });
      if (res.success) setInstitutes(res.data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load list', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutes();
  }, [typeFilter]);

  const handleAddByEiin = async () => {
    if (!eiinValue.trim()) {
      toast({ title: 'Required', description: 'School ID (EIIN) is needed', variant: 'destructive' });
      return;
    }
    setEiinSubmitting(true);
    try {
      const res = await addInstituteByEiin({
        eiin: eiinValue.trim(),
        name: eiinName.trim() || undefined,
        type: eiinType,
      });
      if (res.success) {
        toast({ title: 'Added', description: 'New school registered successfully', variant: 'success' });
        setEiinModalOpen(false);
        setEiinValue('');
        setEiinName('');
        loadInstitutes();
      } else {
        toast({ title: 'Failed', description: res.message || 'Could not add', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setEiinSubmitting(false);
    }
  };

  const handleDelete = (inst: Institute) => {
    openModal({
      title: 'Remove School',
      description: `Are you sure you want to remove ${inst.name}?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Removal"
          description={`This will remove ${inst.name} from the directory. This action cannot be reversed.`}
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteInstitute(inst.id);
              toast({ title: 'Removed', description: 'School removed from list', variant: 'success' });
              loadInstitutes();
            } catch (err: any) {
              toast({ title: 'Error', description: err.message, variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const filtered = institutes.filter(
    (i) =>
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.eiin?.includes(searchQuery) ||
      i.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      SCHOOL: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      COLLEGE: 'bg-violet-50 text-violet-700 border-violet-100',
      UNIVERSITY: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    };
    return map[type] || 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="space-y-10 text-slate-900 pb-20">
      <Toaster toasts={toasts} removeToast={removeToast} />
      
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">School Directory</h1>
        <p className="text-slate-500 text-lg font-medium">Manage and register educational institutions.</p>
      </div>

      <section className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[320px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  placeholder="Search by name, ID, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-12 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-14 w-[180px] rounded-2xl border-slate-200 bg-white font-bold text-slate-700">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="SCHOOL">School</SelectItem>
                <SelectItem value="COLLEGE">College</SelectItem>
                <SelectItem value="UNIVERSITY">University</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-slate-50" onClick={loadInstitutes}>
              <RefreshCw className={cn('h-5 w-5 text-slate-400', loading && 'animate-spin text-indigo-600')} />
            </Button>
          </div>
          <Button
            className="h-14 rounded-2xl bg-indigo-600 px-8 font-black text-sm text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
            onClick={() => setEiinModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Quick Register
          </Button>
        </div>
      </section>

      {eiinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setEiinModalOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-slate-100 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Register School</h3>
            <p className="text-slate-500 font-medium mb-8">Enter the school details to add it to the list.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">School ID (EIIN)</label>
                <Input
                  value={eiinValue}
                  onChange={(e) => setEiinValue(e.target.value)}
                  placeholder="e.g. 123456"
                  className="h-14 rounded-2xl border-slate-200 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name (optional)</label>
                <Input
                  value={eiinName}
                  onChange={(e) => setEiinName(e.target.value)}
                  placeholder="Enter school name"
                  className="h-14 rounded-2xl border-slate-200 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                <Select value={eiinType} onValueChange={(v) => setEiinType(v as InstituteType)}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="SCHOOL">School</SelectItem>
                    <SelectItem value="COLLEGE">College</SelectItem>
                    <SelectItem value="UNIVERSITY">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-10">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50" onClick={() => setEiinModalOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 h-14 rounded-2xl bg-indigo-600 font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 text-white" onClick={handleAddByEiin} disabled={eiinSubmitting}>
                {eiinSubmitting ? 'Registering...' : 'Complete Registration'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Registered Schools</h2>
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 px-4 py-1 rounded-full font-bold">
            {filtered.length} Total
          </Badge>
        </div>
        
        {loading ? (
          <div className="p-32 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
            <p className="mt-4 text-slate-500 font-bold tracking-tight">Updating records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">No schools found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search or add a new school.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-bold text-slate-900 py-6 pl-10 text-sm">School Name</TableHead>
                  <TableHead className="font-bold text-slate-900 py-6 text-sm">Unique ID</TableHead>
                  <TableHead className="font-bold text-slate-900 py-6 text-sm">Category</TableHead>
                  <TableHead className="font-bold text-slate-900 py-6 text-sm">Location</TableHead>
                  <TableHead className="font-bold text-slate-900 py-6 text-right pr-10 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inst) => (
                  <TableRow key={inst.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="py-6 pl-10">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-sm border border-indigo-100/50">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-slate-900 text-base">{inst.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 font-mono font-bold text-slate-500 tracking-tight">{inst.eiin || 'Not Set'}</TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className={cn('rounded-xl px-4 py-1.5 font-bold text-xs uppercase tracking-wider border-2', getTypeBadge(inst.type))}>
                        {inst.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-slate-600 font-bold">{inst.district || 'Unknown'}</TableCell>
                    <TableCell className="py-6 text-right pr-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 px-5 rounded-xl text-rose-500 hover:bg-rose-50 font-bold transition-all border border-transparent hover:border-rose-100"
                        onClick={() => handleDelete(inst)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
