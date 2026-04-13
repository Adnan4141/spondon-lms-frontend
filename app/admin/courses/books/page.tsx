'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBooks, type Book } from '@/lib/api/books';
import {
  getCourseBooks,
  addCourseBook,
  bulkAddCourseBooks,
  updateCourseBook,
  removeCourseBook,
  type CourseBook,
} from '@/lib/api/course-books';
import type { Course } from '@/types/course';
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
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
  ArrowRight,
  Layers,
  Link,
  Building2,
  Database,
  ShoppingBag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function CourseBooksPage() {
  const { toast, toasts, removeToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [courseBooks, setCourseBooks] = useState<CourseBook[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [linkIsFree, setLinkIsFree] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) {
        setCourses(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadBooks = async () => {
    try {
      const response = await getBooks();
      if (response.success && response.data) {
        setBooks(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  const loadCourseBooks = async () => {
    if (!selectedCourseId) {
      setCourseBooks([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseBooks(selectedCourseId);
      if (response.success && response.data) {
        setCourseBooks(response.data || []);
      } else {
        setCourseBooks([]);
        setError(response.message || 'Failed to load course books');
      }
    } catch (err: unknown) {
      setCourseBooks([]);
      setError(getErrorMessage(err) || 'Failed to load course books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadBooks();
  }, []);

  useEffect(() => {
    loadCourseBooks();
  }, [selectedCourseId]);

  const availableBooks = books.filter(
    (book) => !courseBooks.some((cb) => cb.bookId === book.id),
  );

  const filteredCourseBooks = courseBooks.filter((cb) =>
    cb.book?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cb.book?.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleLinkSingleBook = async () => {
    if (!selectedCourseId || selectedBookIds.length === 0) {
      toast({ title: 'Error', description: 'Select a course and a book to link', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      await addCourseBook(selectedCourseId, selectedBookIds[0], linkIsFree);
      setLinkDialogOpen(false);
      setSelectedBookIds([]);
      setLinkIsFree(false);
      await loadCourseBooks();
      toast({ title: 'Success', description: 'Book linked to course successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to link book to course', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkLinkBooks = async () => {
    if (!selectedCourseId || selectedBookIds.length === 0) {
      toast({ title: 'Error', description: 'Select at least one book to link', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      await bulkAddCourseBooks(
        selectedCourseId,
        selectedBookIds.map((id) => ({ bookId: id, isFree: linkIsFree })),
      );
      setBulkDialogOpen(false);
      setSelectedBookIds([]);
      setLinkIsFree(false);
      await loadCourseBooks();
      toast({ title: 'Success', description: `${selectedBookIds.length} books linked to course successfully`, variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to link books to course', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectedBook = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const handleToggleFree = async (link: CourseBook) => {
    try {
      await updateCourseBook(link.id, !link.isFree);
      await loadCourseBooks();
      toast({ title: 'Success', description: 'Updated free/paid status for this book', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleRemoveLink = async (id: string) => {
    if (!confirm('Are you sure you want to remove this book from the course?')) return;
    try {
      await removeCourseBook(id);
      await loadCourseBooks();
      toast({ title: 'Success', description: 'Book removed from course successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to remove book from course', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter & Context Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <Select
                value={selectedCourseId}
                onValueChange={(v) => {
                  setSelectedCourseId(v);
                  setSelectedBookIds([]);
                }}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-indigo-600 shadow-inner border-2">
                  <SelectValue placeholder="Identify Target Course Context" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="font-bold py-3 uppercase text-[11px] tracking-widest">
                      {course.name} ({course.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadCourseBooks}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {selectedCourseId && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                onClick={() => setLinkDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4 text-emerald-500" />
                Link Asset
              </Button>
              <Button
                className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
                onClick={() => setBulkDialogOpen(true)}
              >
                <Layers className="mr-2 h-4 w-4" />
                Bulk Mapping
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
               <Database className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Linked Assets</h2>
              <p className="mt-0.5 text-base font-bold text-indigo-500">{selectedCourse?.name || 'Academic Curriculum'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-[240px] rounded-xl border-slate-200 bg-white pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {!selectedCourseId ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <Link className="h-12 w-12 text-slate-200" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Awaiting Course Context Initialization...</p>
          </div>
        ) : loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Mapping...</p>
          </div>
        ) : filteredCourseBooks.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No materials mapped to this curriculum.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Material Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Value</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Free Access</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourseBooks.map((link) => (
                  <TableRow key={link.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm", link.book?.isEbook ? "bg-indigo-500" : "bg-emerald-500")}>
                             {link.book?.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{link.book?.name || '-'}</span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">SKU: {link.book?.sku || 'N/A'}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-1", link.book?.isEbook ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                         {link.book?.isEbook ? 'Digital E-Book' : 'Physical Print'}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-5 font-black text-slate-900 text-base">
                       {link.book ? `৳${Number(link.book.price).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="py-5 text-center">
                       <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all",
                          link.isFree 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white" 
                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-900 hover:text-white"
                        )}
                        onClick={() => handleToggleFree(link)}
                      >
                        {link.isFree ? (
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Complimentary</div>
                        ) : (
                          'Paid Addon'
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Remove from course"
                        onClick={() => handleRemoveLink(link.id)}
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

      {/* Link Single Book Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <Link className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Map Institutional Asset</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Associate a single material with this course.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Available Material Catalog</label>
              <Select
                value={selectedBookIds[0] || undefined}
                onValueChange={(v) => setSelectedBookIds(v ? [v] : [])}
              >
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-900 border-2 shadow-inner">
                  <SelectValue placeholder="Identify material to link..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                  {availableBooks.map((book) => (
                    <SelectItem key={book.id} value={book.id} className="rounded-xl py-3 font-bold">
                      {book.name} ({book.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableBooks.length === 0 && (
                <p className="text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                  All catalog assets are already mapped to this course context.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Pricing Strategy</label>
              <Select
                value={linkIsFree ? 'yes' : 'no'}
                onValueChange={(v) => setLinkIsFree(v === 'yes')}
              >
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                  <SelectItem value="no" className="rounded-xl py-3 font-bold">Premium - Billed Separately</SelectItem>
                  <SelectItem value="yes" className="rounded-xl py-3 font-bold uppercase text-emerald-600">Complementary - Included in Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setLinkDialogOpen(false)}>Discard</Button>
            <Button
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              onClick={handleLinkSingleBook}
              disabled={submitting || !selectedBookIds[0]}
            >
              {submitting ? 'Synchronizing...' : 'Authorize Linkage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Link Books Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-4xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Bulk Curriculum Mapping</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Coordinate multiple material associations simultaneously.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            <div className="space-y-8 py-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Available Assets</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableBooks.length === 0 ? (
                    <div className="sm:col-span-2 py-12 text-center rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/30">
                       <Database className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                       <p className="text-sm font-black uppercase tracking-widest text-slate-300">Catalog is exhausted for this course context.</p>
                    </div>
                  ) : (
                    availableBooks.map((book) => {
                      const selected = selectedBookIds.includes(book.id);
                      return (
                        <div
                          key={book.id}
                          className={cn(
                            "flex items-center gap-4 rounded-2xl border-2 p-4 transition-all cursor-pointer group",
                            selected ? "bg-indigo-50/50 border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-100 hover:border-indigo-200"
                          )}
                          onClick={() => toggleSelectedBook(book.id)}
                        >
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
                            selected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-transparent"
                          )}>
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 overflow-hidden text-ellipsis">
                            <p className="font-black text-slate-900 text-sm truncate">{book.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {book.sku} • ৳{Number(book.price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Collective Pricing Strategy</label>
                <Select
                  value={linkIsFree ? 'yes' : 'no'}
                  onValueChange={(v) => setLinkIsFree(v === 'yes')}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl p-2">
                    <SelectItem value="no" className="rounded-xl py-3 font-bold">Premium - Billed Separately</SelectItem>
                    <SelectItem value="yes" className="rounded-xl py-3 font-bold uppercase text-emerald-600">Complementary - Included in Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="ghost"
              className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all"
              onClick={() => {
                setBulkDialogOpen(false);
                setSelectedBookIds([]);
              }}
            >
              Discard Mapping
            </Button>
            <Button
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              onClick={handleBulkLinkBooks}
              disabled={submitting || selectedBookIds.length === 0}
            >
              {submitting ? 'Processing Batch...' : `Map ${selectedBookIds.length} Asset(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
