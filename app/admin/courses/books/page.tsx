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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

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
      toast({
        title: 'Error',
        description: 'Select a course and a book to link',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmitting(true);
      await addCourseBook(selectedCourseId, selectedBookIds[0], linkIsFree);
      setLinkDialogOpen(false);
      setSelectedBookIds([]);
      setLinkIsFree(false);
      await loadCourseBooks();
      toast({
        title: 'Success',
        description: 'Book linked to course successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to link book to course',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkLinkBooks = async () => {
    if (!selectedCourseId || selectedBookIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Select at least one book to link',
        variant: 'destructive',
      });
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
      toast({
        title: 'Success',
        description: `${selectedBookIds.length} books linked to course successfully`,
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to link books to course',
        variant: 'destructive',
      });
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
      toast({
        title: 'Success',
        description: 'Updated free/paid status for this book',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveLink = async (id: string) => {
    if (!confirm('Are you sure you want to remove this book from the course?')) {
      return;
    }
    try {
      await removeCourseBook(id);
      await loadCourseBooks();
      toast({
        title: 'Success',
        description: 'Book removed from course successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to remove book from course',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Course &amp; Book Mapping</h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Link books and materials with courses, and control whether they are free or paid with the course.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <label className="mb-1 block text-base font-medium">Select Course</label>
            <Select
              value={selectedCourseId}
              onValueChange={(v) => {
                setSelectedCourseId(v);
                setSelectedBookIds([]);
              }}
            >
              <SelectTrigger className="h-10 border-border bg-background">
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourseId && (
            <>
              <Button
                className="mt-6 bg-primary hover:bg-primary/90"
                onClick={() => setLinkDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Link Single Book
              </Button>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setBulkDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Bulk Link Books
              </Button>
              <Button
                variant="outline"
                className="mt-6"
                onClick={loadCourseBooks}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </>
          )}
        </div>
      </section>

      {selectedCourse && (
        <section className="glass-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-medium">{selectedCourse.name}</p>
              <p className="text-base text-muted-foreground">
                Code: {selectedCourse.code} • Program: {selectedCourse.program?.name ?? 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-base text-muted-foreground">
                Linked Books: {courseBooks.length}
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {selectedCourseId && (
        <section className="glass-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Linked Books</h2>
              <p className="text-base text-muted-foreground">
                Books and materials available with this course
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search linked books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[220px] border-border bg-background pl-10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading course books...</div>
          ) : filteredCourseBooks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery
                ? 'No books found matching your search.'
                : 'No books linked to this course yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Book</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Free With Course</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourseBooks.map((link) => (
                  <TableRow key={link.id} className="hover:bg-muted/45">
                    <TableCell className="font-medium">
                      {link.book?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {link.book?.sku ? (
                        <Badge variant="outline">{link.book.sku}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.book?.isEbook ? 'secondary' : 'default'}>
                        {link.book?.isEbook ? 'E-Book' : 'Physical'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {link.book ? (
                        <span className="text-base tabular-nums">
                          {link.book.price.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'BDT',
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={link.isFree ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-base"
                        onClick={() => handleToggleFree(link)}
                      >
                        {link.isFree ? 'Free' : 'Paid'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove from course"
                        onClick={() => handleRemoveLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      {/* Link Single Book Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-3xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Link Book to Course</DialogTitle>
            <DialogDescription>
              Select a single book to link with {selectedCourse?.name ?? 'the selected course'}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-base font-medium">Book</label>
                <Select
                  value={selectedBookIds[0] || undefined}
                  onValueChange={(v) => setSelectedBookIds(v ? [v] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.name} ({book.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableBooks.length === 0 && (
                  <p className="text-base text-muted-foreground">
                    All books are already linked to this course.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium">Free With Course?</label>
                <Select
                  value={linkIsFree ? 'yes' : 'no'}
                  onValueChange={(v) => setLinkIsFree(v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No - paid separately</SelectItem>
                    <SelectItem value="yes">Yes - free with course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkSingleBook}
              disabled={submitting || !selectedBookIds[0]}
            >
              {submitting ? 'Linking...' : 'Link Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Link Books Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Bulk Link Books</DialogTitle>
            <DialogDescription>
              Select multiple books to link with {selectedCourse?.name ?? 'the selected course'}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-base font-medium">Available Books</label>
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {availableBooks.length === 0 ? (
                    <p className="text-base text-muted-foreground">
                      All books are already linked to this course.
                    </p>
                  ) : (
                    availableBooks.map((book) => {
                      const selected = selectedBookIds.includes(book.id);
                      return (
                        <div
                          key={book.id}
                          className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleSelectedBook(book.id)}
                        >
                          {selected ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-base">{book.name}</p>
                            <p className="text-base text-muted-foreground">
                              {book.sku} •{' '}
                              {book.isEbook ? 'E-Book' : 'Physical'} •{' '}
                              {book.price.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'BDT',
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedBookIds.length > 0 && (
                  <p className="text-base text-muted-foreground">
                    {selectedBookIds.length} book(s) selected
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">Free With Course?</label>
                <Select
                  value={linkIsFree ? 'yes' : 'no'}
                  onValueChange={(v) => setLinkIsFree(v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No - paid separately</SelectItem>
                    <SelectItem value="yes">Yes - free with course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button
              variant="outline"
              onClick={() => {
                setBulkDialogOpen(false);
                setSelectedBookIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkLinkBooks}
              disabled={submitting || selectedBookIds.length === 0}
            >
              {submitting ? 'Linking...' : `Link ${selectedBookIds.length} Book(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

