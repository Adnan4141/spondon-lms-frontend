'use client';

import { useEffect, useState } from 'react';
import { getPrograms } from '@/lib/api/programs';
import { getCourseById, getCourses, updateCourse, createCourse, deleteCourse } from '@/lib/api/courses';
import {
  getCourseContents,
  createCourseContent,
  deleteCourseContent,
} from '@/lib/api/course-contents';
import {
  AdmissionStatus,
  Course,
  CourseDetails,
  CourseStatus,
  CourseType,
  CreateCourseDto,
  GetCoursesParams,
  Program,
  UpdateCourseDto,
} from '@/types/course';
import {
  CourseContent,
  ContentType,
  CreateCourseContentDto,
  CourseOutline,
} from '@/types/course-content';
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
  BookOpenCheck,
  CalendarClock,
  Download,
  ExternalLink,
  FileText,
  FileVideo,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { CourseDetailsView } from '@/components/admin/courses/CourseDetailsView';
import { cn } from '@/lib/utils';

const statusOptions: (CourseStatus | 'all')[] = ['all', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: (CourseType | 'all')[] = ['all', 'ONLINE', 'OFFLINE'];
const admissionOptions: AdmissionStatus[] = ['OPEN', 'CLOSED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold';
  if (status === 'DISABLED') return 'bg-amber-50 text-amber-700 border-amber-100 font-bold';
  if (status === 'ARCHIVED') return 'bg-slate-100 text-slate-600 border-slate-200 font-bold';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getTypeBadgeClass(type: string) {
  if (type === 'ONLINE') return 'bg-blue-50 text-blue-700 border-blue-100 font-bold';
  if (type === 'OFFLINE') return 'bg-violet-50 text-violet-700 border-violet-100 font-bold';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function CoursesPage() {
  const { openModal, closeModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('ACTIVE');
  const [typeFilter, setTypeFilter] = useState<CourseType | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: GetCoursesParams = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await getCourses(params);

      if (response.success && response.data) {
        let filteredCourses = response.data;
        if (searchQuery.trim()) {
          filteredCourses = filteredCourses.filter(
            (course) =>
              course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.program?.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (typeFilter !== 'all') {
          filteredCourses = filteredCourses.filter((course) => course.type === typeFilter);
        }
        setCourses(filteredCourses);
        if (response.pagination) setPagination(response.pagination);
      } else {
        setCourses([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await getPrograms();
      if (response.success && response.data) setPrograms(response.data);
    } catch {
      setPrograms([]);
    }
  };

  const handleViewCourse = async (courseId: string) => {
    try {
      const response = await getCourseById(courseId);
      if (response.success && response.data) {
        openModal({
          title: 'Course Details',
          description: 'View course details.',
          className: 'sm:max-w-6xl max-h-[92vh] overflow-y-auto',
          content: (
            <CourseDetailsView
              course={response.data as CourseDetails}
              onAfterMutation={async () => {
                await loadCourses();
                closeModal();
              }}
            />
          ),
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load course details', variant: 'destructive' });
    }
  };

  const handleEditCourse = async (courseId: string) => {
    try {
      const response = await getCourseById(courseId);
      if (response.success && response.data) {
        openModal({
          title: 'Update Course',
          description: 'Modify course structure, pricing, or status.',
          className: 'sm:max-w-6xl max-h-[92vh] overflow-y-auto',
          content: <CourseForm programs={programs} course={response.data as CourseDetails} onSuccess={loadCourses} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load course for editing', variant: 'destructive' });
    }
  };

  const handleCreateCourse = () => {
        openModal({
          title: 'Create Course',
          description: 'Add a new course.',
      className: 'sm:max-w-5xl max-h-[92vh] overflow-y-auto',
      content: <CourseForm programs={programs} onSuccess={loadCourses} />,
    });
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeletingCourseId(courseToDelete.id);
      const response = await deleteCourse(courseToDelete.id);
      
      if (response.success) {
        toast({ title: 'Success', description: 'Course deleted successfully', variant: 'success' });
        setDeleteConfirmOpen(false);
        setCourseToDelete(null);
        loadCourses();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to delete course', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    } finally {
      setDeletingCourseId(null);
    }
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { loadCourses(); }, [pagination.page, statusFilter]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) loadCourses();
      else setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter]);

  return (
    <div className="space-y-8 text-slate-900">
      {/* Search & Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search courses by name, slug, or program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Status' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-xl">
                {typeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Types' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
              onClick={loadCourses}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateCourse}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Course Registry</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Live system database</p>
            <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-slate-500">
              Student view: <strong className="text-slate-700">Course → Subjects (routes)</strong> → Chapters → Segments. Manage subjects in each course&apos;s{' '}
              <strong className="text-slate-700">Course Content</strong> tab (Subject field on every resource).
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {pagination.total} Total Records
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No records found in current view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Slug</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Course Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Program</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Modality</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pricing</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 font-mono text-base font-black text-indigo-600 uppercase tracking-tighter">{course.slug}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-4">
                          {course.thumbnail ? (
                            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                               <img src={course.thumbnail || 'https://placehold.co/400x225?text=Course'} alt={course.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-dashed border-slate-200 shrink-0">
                               <BookOpenCheck className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{course.name}</span>
                             <span className="text-base font-medium text-slate-400 uppercase tracking-tighter">ID: {course.id.slice(0, 8)}...</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-base font-bold text-slate-500">{course.program?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm", getTypeBadgeClass(course.type))}>
                        {course.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.offerPrice != null && Number(course.offerPrice) < Number(course.fee) ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 line-through font-medium">৳{Number(course.fee).toLocaleString()}</span>
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              🔥 {Math.round(((Number(course.fee) - Number(course.offerPrice)) / Number(course.fee)) * 100)}% OFF
                            </span>
                          </div>
                          <p className="font-black text-emerald-700 text-base">৳{Number(course.offerPrice).toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="font-black text-slate-900 text-base">৳{Number(course.fee).toLocaleString()}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm", getStatusBadgeClass(course.status))}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          onClick={() => handleViewCourse(course.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          onClick={() => handleEditCourse(course.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-rose-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                          onClick={() => handleDeleteClick(course)}
                          disabled={deletingCourseId === course.id}
                        >
                          {deletingCourseId === course.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <><Trash2 className="h-3 w-3 mr-1" />Delete</>
                          )}
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
            Viewing Page <span className="text-indigo-600">{pagination.page}</span> / {pagination.pages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">Delete Course</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {courseToDelete && (
            <div className="my-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{courseToDelete.name}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Slug: {courseToDelete.slug}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl"
              disabled={deletingCourseId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-rose-600 hover:bg-rose-700"
              disabled={deletingCourseId !== null}
            >
              {deletingCourseId ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}