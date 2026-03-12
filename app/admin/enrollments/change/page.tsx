'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments, changeEnrollmentBatch, changeEnrollmentBranch, bulkChangeBatch, bulkChangeBranch } from '@/lib/api/enrollments';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { Batch } from '@/lib/api/batches';
import type { Enrollment } from '@/lib/api/enrollments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  RefreshCw,
  Search,
  ArrowRightLeft,
  Users,
  Check,
  ArrowRight,
  GraduationCap,
  Building2,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Phone,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function EnrollmentChangePage() {
  const { toast, toasts, removeToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);

  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [changeType, setChangeType] = useState<'batch' | 'branch' | null>(null);
  const [newBatchId, setNewBatchId] = useState<string>('');
  const [newBranchId, setNewBranchId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedBranch) {
      loadBatches(selectedCourse || '', selectedBranch === 'all' ? undefined : selectedBranch);
      loadEnrollments();
    } else {
      setBatches([]);
      setEnrollments([]);
    }
  }, [selectedCourse, selectedBranch, selectedBatch]);

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

  const loadBatches = async (courseId: string, branchId?: string) => {
    try {
      const response = await getBatches({ courseId, branchId });
      if (response.success && response.data) {
        setBatches(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load batches:', err);
    }
  };

  const loadEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      setError(null);
      const params: any = { courseId: selectedCourse };
      if (selectedBranch && selectedBranch !== 'all') params.branchId = selectedBranch;
      if (selectedBatch && selectedBatch !== 'all') params.batchId = selectedBatch;

      const response = await getEnrollments(params);

      if (response.success && response.data) {
        setEnrollments(response.data || []);
      } else {
        setError(response.message || 'Failed to load enrollments');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChangeDialog = (type: 'batch' | 'branch') => {
    if (selectedEnrollments.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please identify at least one student enrollment to modify.',
        variant: 'destructive',
      });
      return;
    }
    setChangeType(type);
    setNewBatchId('');
    setNewBranchId('');
    setReason('');
    setChangeDialogOpen(true);
  };

  const handleChange = async () => {
    if (!changeType || selectedEnrollments.length === 0) return;

    try {
      setSubmitting(true);
      if (selectedEnrollments.length === 1) {
        const enrollmentId = selectedEnrollments[0];
        if (changeType === 'batch') {
          if (!newBatchId) {
            toast({ title: 'Error', description: 'Please select a target batch', variant: 'destructive' });
            return;
          }
          await changeEnrollmentBatch(enrollmentId, newBatchId, reason);
        } else {
          if (!newBranchId) {
            toast({ title: 'Error', description: 'Please select a target branch', variant: 'destructive' });
            return;
          }
          await changeEnrollmentBranch(enrollmentId, newBranchId, reason);
        }
        toast({
          title: 'Modification Secured',
          description: `Strategic migration to new ${changeType} finalized.`,
          variant: 'success',
        });
      } else {
        if (changeType === 'batch') {
          if (!newBatchId) {
            toast({ title: 'Error', description: 'Please select a target batch', variant: 'destructive' });
            return;
          }
          await bulkChangeBatch({
            courseId: selectedCourse,
            branchId: selectedBranch === 'all' ? undefined : selectedBranch,
            toBatchId: newBatchId,
            enrollmentIds: selectedEnrollments,
            reason,
          });
        } else {
          if (!newBranchId) {
            toast({ title: 'Error', description: 'Please select a target branch', variant: 'destructive' });
            return;
          }
          await bulkChangeBranch({
            courseId: selectedCourse,
            toBranchId: newBranchId,
            enrollmentIds: selectedEnrollments,
            reason,
          });
        }
        toast({
          title: 'Bulk Logic Executed',
          description: `${selectedEnrollments.length} enrollments synchronized to new parameters.`,
          variant: 'success',
        });
      }
      setChangeDialogOpen(false);
      setSelectedEnrollments([]);
      setReason('');
      await loadEnrollments();
    } catch (err: unknown) {
      toast({
        title: 'Execution Failed',
        description: getErrorMessage(err) || 'Failed to process enrollment change',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) =>
    enrollment.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.student?.mobile.includes(searchQuery)
  );

  const toggleEnrollment = (id: string) => {
    if (selectedEnrollments.includes(id)) {
      setSelectedEnrollments(selectedEnrollments.filter((eid) => eid !== id));
    } else {
      setSelectedEnrollments([...selectedEnrollments, id]);
    }
  };

  const toggleAll = () => {
    if (selectedEnrollments.length === filteredEnrollments.length && filteredEnrollments.length > 0) {
      setSelectedEnrollments([]);
    } else {
      setSelectedEnrollments(filteredEnrollments.map((e) => e.id));
    }
  };

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name || 'Course Context';

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Selected Capacity', value: selectedEnrollments.length, color: 'from-blue-600 to-cyan-500', icon: GraduationCap },
          { label: 'Course Visibility', value: selectedCourse ? 'Active Target' : 'Select Context', color: 'from-indigo-600 to-purple-600', icon: Layers },
          { label: 'Available Nodes', value: branches.length, color: 'from-emerald-600 to-teal-500', icon: Building2 },
          { label: 'Migration Buffer', value: batches.length, color: 'from-rose-600 to-pink-600', icon: ArrowRightLeft },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Filter & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[240px]">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-indigo-600 shadow-sm border-2">
                  <SelectValue placeholder="Identify Target Course" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="font-bold py-3 uppercase text-[11px] tracking-widest">
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white font-medium shadow-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="font-medium">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="font-medium">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white font-medium shadow-sm">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="font-medium">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id} className="font-medium">
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadEnrollments}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              onClick={() => handleOpenChangeDialog('batch')}
              disabled={selectedEnrollments.length === 0}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4 text-emerald-500" />
              Migrate Batch
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              onClick={() => handleOpenChangeDialog('branch')}
              disabled={selectedEnrollments.length === 0}
            >
              <Building2 className="mr-2 h-4 w-4 text-indigo-500" />
              Transfer Branch
            </Button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl border-2 transition-all",
                selectedEnrollments.length === filteredEnrollments.length && filteredEnrollments.length > 0
                  ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-white border-slate-200 text-transparent hover:border-indigo-300"
              )}
              onClick={toggleAll}
            >
              <Check className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollment Context</h2>
              <p className="mt-0.5 text-base font-bold text-indigo-500">{selectedCourseName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                placeholder="Find beneficiary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-[240px] rounded-xl border-slate-200 bg-white pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {selectedEnrollments.length} Active Selections
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Registry...</p>
          </div>
        ) : !selectedCourse ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <Layers className="h-12 w-12 text-slate-200" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Awaiting Course Selection to Initialize Registry</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No matching enrollment records identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="w-12 px-8 text-center">Action</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Student Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Communication</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Assigned Batch</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch Node</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Operational Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((e) => (
                  <TableRow key={e.id} className={cn(
                    "group border-slate-100 transition-colors hover:bg-slate-50/80",
                    selectedEnrollments.includes(e.id) && "bg-indigo-50/30"
                  )}>
                    <TableCell className="px-8 py-5 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg border-2 transition-all",
                          selectedEnrollments.includes(e.id)
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-slate-200 text-transparent group-hover:border-indigo-300"
                        )}
                        onClick={() => toggleEnrollment(e.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{e.student?.fullName || '-'}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">UID: {e.id.slice(0, 8)}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center gap-2 text-base font-bold text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-emerald-500" />
                          {e.student?.mobile || '-'}
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className="rounded-lg bg-white border-slate-200 px-3 py-1 font-bold text-slate-700 shadow-sm uppercase tracking-tighter text-[11px]">
                         {e.batch?.name || 'Unassigned'}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-base font-bold text-slate-700 uppercase tracking-tighter">{e.branch?.name || 'Central'}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-center">
                       <Badge
                        variant="outline"
                        className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-widest text-[10px] shadow-sm",
                          e.status === 'ACTIVE'
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : e.status === 'PAUSED'
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                        )}
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Change Dialog */}
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-3xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm border",
                changeType === 'batch' ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-indigo-50 text-indigo-600 border-indigo-100/50"
              )}>
                <ArrowRightLeft className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  Institutional {changeType} Migration
                </DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">
                  Relocating {selectedEnrollments.length} selected beneficiaries to new academic parameters.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            <div className="space-y-8 py-8">
              {changeType === 'batch' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="h-3.5 w-3.5 text-emerald-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Target Academic Batch *</label>
                  </div>
                  <Select value={newBatchId} onValueChange={setNewBatchId}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-900 border-2">
                      <SelectValue placeholder="Search target batch registry..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id} className="rounded-xl py-3 font-bold uppercase text-[11px] tracking-widest">
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Target Institutional Branch *</label>
                  </div>
                  <Select value={newBranchId} onValueChange={setNewBranchId}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-900 border-2">
                      <SelectValue placeholder="Search target node registry..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id} className="rounded-xl py-3 font-bold uppercase text-[11px] tracking-widest">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Strategic Justification (Optional)</label>
                </div>
                <Textarea
                  className="w-full rounded-3xl border-2 border-slate-200 bg-slate-50/30 px-5 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px] outline-none leading-relaxed"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Summarize the logic for this migration..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setChangeDialogOpen(false)}>
              Discard
            </Button>
            <Button 
              className={cn(
                "h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50",
                changeType === 'batch' ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700" : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
              )}
              onClick={handleChange} 
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Migrating...</span>
                </div>
              ) : (
                `Execute ${changeType} Migration`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
