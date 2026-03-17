'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getCourseBranches, addCourseBranch, bulkAddCourseBranches, removeCourseBranch } from '@/lib/api/course-branches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { CourseBranch } from '@/lib/api/course-branches';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  Network,
  ShieldCheck,
  Layers,
  MapPin,
  Phone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function CourseBranchesPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courseBranches, setCourseBranches] = useState<CourseBranch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseBranches();
    } else {
      setCourseBranches([]);
    }
  }, [selectedCourse]);

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

  const loadCourseBranches = async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseBranches(selectedCourse);
      if (response.success && response.data) {
        setCourseBranches(response.data || []);
      } else {
        setError(response.message || 'Failed to load course branches');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load course branches');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!selectedCourse || selectedBranches.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a course and at least one branch',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (selectedBranches.length === 1) {
        await addCourseBranch(selectedCourse, selectedBranches[0]);
        toast({
          title: 'Success',
          description: 'Branch added to course successfully',
          variant: 'success',
        });
      } else {
        await bulkAddCourseBranches(selectedCourse, selectedBranches);
        toast({
          title: 'Success',
          description: `${selectedBranches.length} branches added to course successfully`,
          variant: 'success',
        });
      }
      setAddDialogOpen(false);
      setBulkAddDialogOpen(false);
      setSelectedBranches([]);
      await loadCourseBranches();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to add branch',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBranch = (id: string) => {
    openModal({
      title: 'Branch Disconnection',
      description: 'Are you sure you want to remove this branch from the course curriculum? Access permissions for this location will be revoked.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Removal"
          description="Decoupling the institutional node from this specific academic program."
          variant="danger"
          onConfirm={async () => {
            try {
              await removeCourseBranch(id);
              toast({
                title: 'Success',
                description: 'Branch removed from course successfully',
                variant: 'success',
              });
              await loadCourseBranches();
            } catch (err: unknown) {
              toast({
                title: 'Error',
                description: getErrorMessage(err) || 'Failed to remove branch',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  const availableBranches = branches.filter(
    (branch) => !courseBranches.some((cb) => cb.branchId === branch.id)
  );

  const filteredBranches = courseBranches.filter((cb) =>
    cb.branch?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter & Action Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-indigo-600 shadow-inner border-2">
                  <SelectValue placeholder="Identify Target Course Context" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="font-bold py-3 uppercase text-[11px] tracking-widest">
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadCourseBranches}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {selectedCourse && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4 text-emerald-500" />
                Authorize Node
              </Button>
              <Button
                className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
                onClick={() => setBulkAddDialogOpen(true)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Bulk Integration
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
               <MapPin className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Access Nodes</h2>
              <p className="mt-0.5 text-base font-bold text-indigo-500">{selectedCourseData?.name || 'Academic Program'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                placeholder="Find mapped branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-[240px] rounded-xl border-slate-200 bg-white pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {!selectedCourse ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <Building2 className="h-12 w-12 text-slate-200" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Awaiting Course Selection to Initialize Node Matrix</p>
          </div>
        ) : loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Nodes...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No branch nodes mapped to this program.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-sm uppercase tracking-widest text-slate-400">Branch Identity</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Node Code</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Physical Location</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Contact Reference</TableHead>
                  <TableHead className="px-8 font-black text-sm uppercase tracking-widest text-slate-400 text-right">Operational Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((cb) => (
                  <TableRow key={cb.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{cb.branch?.name || '-'}</span>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className="rounded-lg bg-white border-slate-200 px-3 py-1 font-bold text-slate-700 shadow-sm uppercase tracking-tighter text-[11px]">
                         {cb.branch?.code || 'NODE-00'}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                       <span className="text-sm font-bold text-slate-500 italic line-clamp-1 max-w-[200px]">{cb.branch?.address || '-'}</span>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center gap-2 text-base font-bold text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-emerald-500" />
                          {cb.branch?.phone || '-'}
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        onClick={() => handleRemoveBranch(cb.id)}
                        title="Revoke Node Access"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Add Branch Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Authorize Node Access</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Associate an institutional branch with this program context.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Target Institutional Node</label>
              <Select
                value={selectedBranches[0] || undefined}
                onValueChange={(v) => setSelectedBranches([v])}
              >
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-900 border-2 shadow-inner">
                  <SelectValue placeholder="Identify branch to map..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="rounded-xl py-3 font-bold">
                      {branch.name} {branch.code && `(${branch.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableBranches.length === 0 && (
                <p className="text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                  All institutional nodes are already integrated with this program context.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setAddDialogOpen(false)}>
              Discard
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              onClick={handleAddBranch} 
              disabled={submitting || selectedBranches.length === 0}
            >
              {submitting ? 'Synchronizing...' : 'Authorize Integration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-4xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
                <Network className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Bulk Node Matrix Integration</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Coordinate multiple institutional branch mappings simultaneously.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            <div className="space-y-8 py-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Available Institutional Network</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableBranches.length === 0 ? (
                    <div className="sm:col-span-2 py-12 text-center rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/30">
                       <Building2 className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                       <p className="text-sm font-black uppercase tracking-widest text-slate-300">Global network is already integrated for this program.</p>
                    </div>
                  ) : (
                    availableBranches.map((branch) => {
                      const selected = selectedBranches.includes(branch.id);
                      return (
                        <div
                          key={branch.id}
                          className={cn(
                            "flex items-center gap-4 rounded-2xl border-2 p-4 transition-all cursor-pointer group",
                            selected ? "bg-indigo-50/50 border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-100 hover:border-indigo-200"
                          )}
                          onClick={() => {
                            if (selectedBranches.includes(branch.id)) {
                              setSelectedBranches(selectedBranches.filter((id) => id !== branch.id));
                            } else {
                              setSelectedBranches([...selectedBranches, branch.id]);
                            }
                          }}
                        >
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
                            selected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-transparent"
                          )}>
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 overflow-hidden text-ellipsis">
                            <p className="font-black text-slate-900 text-sm truncate">{branch.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Code: {branch.code || 'N/A'} • {branch.phone || 'No Contact'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="ghost"
              className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all"
              onClick={() => {
                setBulkAddDialogOpen(false);
                setSelectedBranches([]);
              }}
            >
              Discard Mapping
            </Button>
            <Button
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              onClick={handleAddBranch}
              disabled={submitting || selectedBranches.length === 0}
            >
              {submitting ? 'Processing Matrix...' : `Integrate ${selectedBranches.length} Node(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
