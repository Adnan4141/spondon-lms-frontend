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
  Sparkles,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ProgramForm } from '@/components/admin/programs/ProgramForm';
import { ProgramDetailsView } from '@/components/admin/programs/ProgramDetailsView';
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
          title: 'Program Intelligence',
          description: 'Detailed view of academic program and associated courses.',
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
      title: 'Launch New Program',
      description: 'Create a new academic program container.',
      className: 'sm:max-w-2xl',
      content: <ProgramForm onSuccess={loadPrograms} />,
    });
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProgram(programId);
      await loadPrograms();
      toast({ title: 'Success', description: 'Program deleted successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to delete program', variant: 'destructive' });
    }
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPrograms = programs.length;
  const totalCourses = programs.reduce((sum, program) => sum + ((program as any)._count?.courses || 0), 0);

  return (
    <div className="space-y-8 text-slate-900">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-indigo-100/50 shadow-sm">
              <GraduationCap className="h-3.5 w-3.5" />
              Academic Workspace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Program <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Architecture</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Manage core academic programs and curriculum structure from a unified institutional perspective.
            </p>
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

      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Programs', value: totalPrograms, color: 'from-blue-600 to-cyan-500', icon: GraduationCap },
          { label: 'Total Courses', value: totalCourses, color: 'from-indigo-600 to-purple-600', icon: BookOpenCheck },
          { label: 'Avg Density', value: totalPrograms > 0 ? (totalCourses / totalPrograms).toFixed(1) : 0, color: 'from-emerald-600 to-teal-500', icon: Sparkles },
          { label: 'Active Filter', value: filteredPrograms.length, color: 'from-rose-600 to-pink-600', icon: Search },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Search Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative flex flex-wrap gap-4">
          <div className="min-w-[300px] flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search programs by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner"
              />
            </div>
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadPrograms}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Program Registry</h2>
            <p className="mt-0.5 text-xs font-bold text-indigo-500">Institutional baseline</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalPrograms} Programs
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
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{program.name}</span>
                          <span className="text-[10px] font-medium text-slate-400">ID: {program.id.slice(0, 8)}...</span>
                       </div>
                    </TableCell>
                    <TableCell className="max-w-xs py-5">
                       <p className="truncate text-xs font-medium text-slate-500">
                         {program.description || 'No description provided.'}
                       </p>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className="rounded-lg bg-indigo-50 border-indigo-100 text-indigo-700 font-black text-[10px] uppercase px-2.5 py-1">
                         {(program as any)._count?.courses || 0} Courses
                       </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400">Added: {new Date(program.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] font-bold text-slate-500">Mod: {new Date(program.updatedAt).toLocaleDateString()}</span>
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
