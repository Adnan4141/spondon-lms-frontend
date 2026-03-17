'use client';

import { useEffect, useState } from 'react';
import {
  getPrograms,
  getProgramById,
  deleteProgram,
} from '@/lib/api/programs';
import type { Program } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  BookOpenCheck,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  GraduationCap,
  Layers,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ProgramForm } from '@/components/admin/programs/ProgramForm';
import { ProgramDetailsView } from '@/components/admin/programs/ProgramDetailsView';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function ProgramsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPrograms();
      if (response.success && response.data) {
        setPrograms(response.data);
      } else {
        setError(response.message || 'Failed to load programs');
        setPrograms([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load programs');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleViewProgram = async (programId: string) => {
    try {
      const response = await getProgramById(programId);
      if (response.success && response.data) {
        openModal({
          title: 'Program Details',
          description: 'View program details.',
          className: 'sm:max-w-4xl',
          content: <ProgramDetailsView program={response.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load program details', variant: 'destructive' });
    }
  };

  const handleEditProgram = async (programId: string) => {
    try {
      const response = await getProgramById(programId);
      if (response.success && response.data) {
        openModal({
          title: 'Update Program',
          description: 'Modify program identity and description.',
          className: 'sm:max-w-2xl',
          content: <ProgramForm program={response.data} onSuccess={loadPrograms} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load program for editing', variant: 'destructive' });
    }
  };

  const handleCreateProgram = () => {
        openModal({
          title: 'Create Program',
          description: 'Add a new program.',
      className: 'sm:max-w-2xl',
      content: <ProgramForm onSuccess={loadPrograms} />,
    });
  };

  const handleDeleteProgram = async (id: string) => {
    openModal({
      title: 'Program Deletion',
      description: 'Are you sure you want to permanently remove this academic program? All associated course linkages will be impacted.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Deletion"
          description="Permanently purging this program from the institutional registry."
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteProgram(id);
              await loadPrograms();
              toast({ title: 'Success', description: 'Program deleted successfully', variant: 'success' });
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-900">
      {/* Search Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search programs by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner"
                />
              </div>
            </div>
            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadPrograms}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateProgram}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Program Registry</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Institutional baseline</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Programs
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No matching programs identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Program Name</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Curriculum Scope</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Linked Courses</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Timeline</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow key={program.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          {program.thumbnail ? (
                            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                               <img src={program.thumbnail || 'https://placehold.co/400x225?text=Program'} alt={program.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-dashed border-slate-200 shrink-0">
                               <GraduationCap className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{program.name}</span>
                             <span className="text-sm font-medium text-slate-400 uppercase tracking-tighter">ID: {program.id.slice(0, 8)}...</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="max-w-xs py-5">
                       <p className="truncate text-base font-medium text-slate-500">
                         {program.description || 'No description provided.'}
                       </p>
                    </TableCell>
                    <TableCell className="py-5">
                       <span className="text-sm font-medium text-slate-600">{(program as any)._count?.courses ?? 0}</span>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-400">Added: {new Date(program.createdAt).toLocaleDateString()}</span>
                          <span className="text-sm font-bold text-slate-500">Mod: {new Date(program.updatedAt).toLocaleDateString()}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewProgram(program.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditProgram(program.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteProgram(program.id)}
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
