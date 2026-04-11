'use client';

import { useEffect, useState } from 'react';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  linkBookToCourse,
  unlinkBookFromCourse,
  addBookCollaborator,
  removeBookCollaborator,
  getCollaboratorRevenue,
  updateCollaboratorRevShare,
  addBookCollaboratorsBulk,
  type Book,
  type CreateBookDto,
  type UpdateBookDto,
  type CollaboratorRevenueSummary,
  type BulkCollaboratorItem,
} from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen,
  Download,
  Edit,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Link,
  Users,
  Building2,
  ArrowRight,
  ShoppingBag,
  Layers,
  Warehouse,
  Database,
  CheckCircle2,
  ChevronsUpDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import type { Program } from '@/lib/api/programs';
import type { Course } from '@/types/course';
import { getUsers } from '@/lib/api/users';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';

type BookFilter = 'all' | 'physical' | 'ebook';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BooksPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<BookFilter>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [collabDialogOpen, setCollabDialogOpen] = useState(false);
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Linking state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isFreeForCourse, setIsFreeForCourse] = useState<boolean>(false);
  const [linkingSubmitting, setLinkSubmitting] = useState(false);

  // Collab state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [collabUserSearch, setCollabUserSearch] = useState('');
  const [collabUserPopoverOpen, setCollabUserPopoverOpen] = useState(false);
  const [collabRole, setCollabRole] = useState<string>('EDITOR');
  const [collabRevenueShare, setCollabRevenueShare] = useState<string>('');
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Bulk collab state
  const [bulkQueue, setBulkQueue] = useState<BulkCollaboratorItem[]>([]);
  const [bulkUserSearch, setBulkUserSearch] = useState('');
  const [bulkUserPopoverOpen, setBulkUserPopoverOpen] = useState(false);
  const [bulkUserId, setBulkUserId] = useState('');
  const [bulkRole, setBulkRole] = useState('EDITOR');
  const [bulkRevShare, setBulkRevShare] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Revenue share state
  const [revShareEdits, setRevShareEdits] = useState<Record<string, string>>({});
  const [revShareSaving, setRevShareSaving] = useState<Record<string, boolean>>({});
  const [revenueSummary, setRevenueSummary] = useState<CollaboratorRevenueSummary | null>(null);
  const [revenueSummaryLoading, setRevenueSummaryLoading] = useState(false);
  const [showRevenueDialog, setShowRevenueDialog] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState<CreateBookDto>({
    name: '',
    sku: '',
    price: 0,
    mrp: undefined,
    author: '',
    description: '',
    isEbook: false,
    fileUrl: '',
    thumbnailUrl: '',
    programId: undefined,
  });
  const [editForm, setEditForm] = useState<UpdateBookDto>({
    name: '',
    sku: '',
    price: 0,
    mrp: undefined,
    author: '',
    description: '',
    isEbook: false,
    fileUrl: '',
    thumbnailUrl: '',
    programId: undefined,
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createThumbnail, setCreateThumbnail] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);

  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBooks();
      if (response.success && response.data) {
        setBooks(response.data);
      } else {
        setBooks([]);
        setError(response.message || 'Failed to load books');
      }
    } catch (err: unknown) {
      setBooks([]);
      setError(getErrorMessage(err) || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [coursesRes, usersRes, programsRes] = await Promise.all([
        getCourses({}),
        getUsers({ limit: 100 }),
        getPrograms(),
      ]);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadBooks();
    loadInitialData();
  }, []);

  const fetchBookDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getBookById(id);
      if (response.success && response.data) {
        const book = response.data as any;
        setBookDetails(book);
        setEditForm({
          name: book.name,
          sku: book.sku,
          price: Number(book.price),
          mrp: book.mrp ? Number(book.mrp) : undefined,
          author: book.author || '',
          description: book.description || '',
          isEbook: book.isEbook,
          fileUrl: book.fileUrl || '',
          thumbnailUrl: book.thumbnailUrl || '',
          programId: (book as any).programId || undefined,
        });
        setEditFile(null);
        setEditThumbnail(null);
        return book;
      }
      throw new Error(response.message || 'Failed to load book details');
    } catch (err: unknown) {
      setBookDetails(null);
      setDetailsError(getErrorMessage(err));
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewBook = async (id: string) => {
    setViewDialogOpen(true);
    await fetchBookDetails(id);
  };

  const handleEditBook = async (id: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchBookDetails(id);
  };

  const handleLinkSubmit = async () => {
    if (!bookDetails || !selectedCourseId) return;
    try {
      setLinkSubmitting(true);
      await linkBookToCourse({
        bookId: bookDetails.id,
        courseId: selectedCourseId,
        isFree: isFreeForCourse
      });
      toast({ title: 'Success', description: 'Book linked to course', variant: 'success' });
      setLinkDialogOpen(false);
      await fetchBookDetails(bookDetails.id);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleUnlink = async (courseId: string) => {
    if (!bookDetails) return;
    openModal({
      title: 'Unlink Book',
      description: 'Are you sure you want to remove this book from the selected course? The digital asset will no longer be available to enrolled students.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Disconnection"
          description="Decoupling this material from the academic course framework."
          variant="warning"
          onConfirm={async () => {
            try {
              await unlinkBookFromCourse(courseId, bookDetails.id);
              toast({ title: 'Success', description: 'Book unlinked successfully', variant: 'success' });
              await fetchBookDetails(bookDetails.id);
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const handleCollabSubmit = async () => {
    if (!bookDetails || !selectedUserId) return;
    try {
      setCollabSubmitting(true);
      const share = collabRevenueShare.trim() ? Number(collabRevenueShare) : undefined;
      if (share !== undefined && (Number.isNaN(share) || share <= 0 || share > 100)) {
        toast({ title: 'Error', description: 'Revenue share must be between 0 and 100', variant: 'destructive' });
        return;
      }
      await addBookCollaborator({
        bookId: bookDetails.id,
        userId: selectedUserId,
        role: collabRole,
        revenueSharePercent: share,
      });
      toast({ title: 'Success', description: 'Collaborator added', variant: 'success' });
      setSelectedUserId('');
      setCollabUserSearch('');
      setCollabRevenueShare('');
      await fetchBookDetails(bookDetails.id);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setCollabSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bookDetails || bulkQueue.length === 0) return;
    setBulkSubmitting(true);
    try {
      const res = await addBookCollaboratorsBulk(bookDetails.id, bulkQueue);
      const result = res?.data;
      const added = result?.data?.filter((r) => r.success).length ?? 0;
      const failed = result?.data?.filter((r) => !r.success).length ?? 0;
      toast({
        title: added > 0 ? 'Bulk Add Complete' : 'Bulk Add Failed',
        description: `${added} added${failed > 0 ? `, ${failed} failed` : ''}`,
        variant: added > 0 ? 'success' : 'destructive',
      });
      setBulkQueue([]);
      setBulkUserId('');
      setBulkUserSearch('');
      setBulkRevShare('');
      await fetchBookDetails(bookDetails.id);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!createForm.name.trim() || !createForm.sku.trim()) {
      setCreateError('Name and SKU are required');
      toast({ title: 'Error', description: 'Name and SKU are required', variant: 'destructive' });
      return;
    }
    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await createBook({ ...createForm }, createFile || undefined, createThumbnail || undefined);
      setCreateDialogOpen(false);
      setCreateForm({
        name: '', sku: '', price: 0, mrp: undefined, author: '', description: '', isEbook: false, fileUrl: '', thumbnailUrl: '', programId: undefined,
      });
      setCreateFile(null);
      setCreateThumbnail(null);
      await loadBooks();
      toast({ title: 'Success', description: 'Book created successfully', variant: 'success' });
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err));
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!bookDetails) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      await updateBook(bookDetails.id, { ...editForm }, editFile || undefined, editThumbnail || undefined);
      setEditDialogOpen(false);
      await loadBooks();
      toast({ title: 'Success', description: 'Book updated successfully', variant: 'success' });
    } catch (err: unknown) {
      setEditError(getErrorMessage(err));
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    openModal({
      title: 'Delete Book',
      description: 'Are you sure you want to permanently delete this material? This will remove all associated stock and sales history records.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Deletion"
          description="Permanently purging this asset from the institutional catalog."
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteBook(id);
              await loadBooks();
              toast({ title: 'Success', description: 'Book deleted successfully', variant: 'success' });
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'ebook' && book.isEbook) ||
      (typeFilter === 'physical' && !book.isEbook);
    const matchesProgram =
      programFilter === 'all' ||
      (programFilter === '__none__' && !(book as any).programId) ||
      (book as any).programId === programFilter;
    return matchesSearch && matchesType && matchesProgram;
  });

  const isDetailsReady = !!bookDetails && !detailsLoading;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search books by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as BookFilter)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All</SelectItem>
                <SelectItem value="physical" className="text-sm font-medium">Physical</SelectItem>
                <SelectItem value="ebook" className="text-sm font-medium">E-Book</SelectItem>
              </SelectContent>
            </Select>

            {programs.length > 0 && (
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="h-12 w-[200px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="all" className="text-sm font-medium">All Programs</SelectItem>
                  <SelectItem value="__none__" className="text-sm font-medium">No Program</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm font-medium">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadBooks}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => window.location.href = '/admin/books/stock'}
            >
              <Warehouse className="mr-2 h-4 w-4" />
              Stock Ledger
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => window.location.href = '/admin/books/sales'}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Sales History
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-violet-600 hover:bg-violet-50 transition-all shadow-sm border-violet-200"
              onClick={() => window.location.href = '/admin/books/orders'}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Online Orders
            </Button>
            <Button
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Books</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">All books and materials</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Books
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No books found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Book</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Price</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Download</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Stock / Sales</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg overflow-hidden", !book.thumbnailUrl && (book.isEbook ? "bg-indigo-500" : "bg-emerald-500"))}>
                             {book.thumbnailUrl ? (
                               <img src={book.thumbnailUrl || 'https://placehold.co/400x600?text=Book'} alt={book.name} className="h-full w-full object-cover" />
                             ) : (
                               book.name.charAt(0)
                             )}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{book.name}</span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{book.sku}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-1", book.isEbook ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                         {book.isEbook ? 'Digital E-Book' : 'Physical Print'}
                       </Badge>
                       {(book as any).program && (
                         <Badge variant="outline" className="mt-1.5 rounded-lg text-[10px] font-bold px-2.5 py-1 bg-violet-50 text-violet-600 border-violet-100">
                           {(book as any).program.name}
                         </Badge>
                       )}
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col">
                          <span className="text-base font-bold text-slate-900">
                            {Number(book.price).toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'BDT',
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[10px] font-black uppercase text-slate-400">Price</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                      {book.isEbook && book.fileUrl ? (
                        <a
                          href={book.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <Download className="h-3 w-3" />
                          Source
                        </a>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest italic">Offline Only</span>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center gap-4 text-base font-bold text-slate-600">
                          <div className="flex items-center gap-1.5" title="Stock">
                             <Building2 className="h-3.5 w-3.5 text-slate-400" />
                             {book._count?.stocks || 0}
                          </div>
                          <div className="flex items-center gap-1.5" title="Sales">
                             <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                             {book._count?.saleItems || 0}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                            onClick={() => { setBookDetails(book); setLinkDialogOpen(true); }}
                            title="Link to Course"
                          >
                            <Link className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
                            onClick={() => {
                              setCollabDialogOpen(true);
                              fetchBookDetails(book.id);
                            }}
                            title="Manage Collaborators"
                          >
                            <Users className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            onClick={() => handleViewBook(book.id)}
                          >
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            onClick={() => handleEditBook(book.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            onClick={() => handleDeleteBook(book.id)}
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

      {/* Create Book Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-4xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <Plus className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Add Book</DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">Add a new book to the catalog.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            <div className="space-y-8 py-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Book Name *</label>
                </div>
                <Input
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm border-2"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Advanced Engineering Physics - Vol. II"
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Author</label>
                  </div>
                  <Input
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2"
                    value={createForm.author || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Price (BDT)</label>
                  </div>
                  <Input
                    type="number"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-black text-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2"
                    value={createForm.price}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">MRP / Original Price (BDT) <span className="normal-case font-medium">— optional, for strikethrough</span></label>
                  </div>
                  <Input
                    type="number"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-black text-slate-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2"
                    value={createForm.mrp ?? ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, mrp: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Description</label>
                </div>
                <textarea
                  className="w-full rounded-3xl border-2 border-slate-200 bg-slate-50/30 px-5 py-4 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px] outline-none leading-relaxed"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Book description..."
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">SKU *</label>
                  </div>
                  <Input
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2"
                    value={createForm.sku}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    placeholder="e.g. PHY-ADV-002"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Database className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Type</label>
                  </div>
                  <Select value={createForm.isEbook ? 'ebook' : 'physical'} onValueChange={(v) => setCreateForm(p => ({ ...p, isEbook: v === 'ebook' }))}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                      <SelectItem value="physical" className="rounded-xl py-3 font-bold">Physical</SelectItem>
                      <SelectItem value="ebook" className="rounded-xl py-3 font-bold">E-Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {programs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="h-3.5 w-3.5 text-violet-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Program Category <span className="normal-case font-medium">— optional</span></label>
                  </div>
                  <Select
                    value={createForm.programId || '__none__'}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, programId: v === '__none__' ? undefined : v }))}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                      <SelectValue placeholder="Select program..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                      <SelectItem value="__none__" className="rounded-xl py-3 font-bold">None</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="rounded-xl py-3 font-bold">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Plus className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Cover Image</label>
                  </div>
                  <div className="group relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 py-3.5 text-sm font-bold text-slate-900 focus:bg-white transition-all border-2 cursor-pointer file:mr-4 file:py-0 file:px-0 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-transparent file:text-indigo-600"
                      onChange={(e) => setCreateThumbnail(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                {createForm.isEbook && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Download className="h-3.5 w-3.5 text-indigo-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">PDF / File</label>
                    </div>
                    <Input
                      type="file"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 py-3.5 text-sm font-bold text-slate-900 focus:bg-white transition-all border-2 cursor-pointer file:mr-4 file:py-0 file:px-0 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-transparent file:text-indigo-600"
                      onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50" 
              onClick={handleCreateSubmit} 
              disabled={createSubmitting}
            >
              {createSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Book'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-4xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100/50">
                <Edit className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Edit Book</DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">Update book details.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            {isDetailsReady && (
              <div className="space-y-8 py-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Book Name *</label>
                  </div>
                  <Input
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-lg font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border-2"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Users className="h-3.5 w-3.5 text-amber-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Author</label>
                    </div>
                    <Input
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border-2"
                      value={editForm.author || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Unit Price (BDT)</label>
                    </div>
                    <Input
                      type="number"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-black text-amber-600 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border-2"
                      value={editForm.price}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">MRP / Original Price (BDT) <span className="normal-case font-medium">— optional, for strikethrough</span></label>
                    </div>
                    <Input
                      type="number"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-black text-slate-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border-2"
                      value={editForm.mrp ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, mrp: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Asset Description</label>
                  </div>
                  <textarea
                    className="w-full rounded-3xl border-2 border-slate-200 bg-slate-50/30 px-5 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all min-h-[120px] outline-none leading-relaxed"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Layers className="h-3.5 w-3.5 text-amber-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">SKU Identifier *</label>
                    </div>
                    <Input
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border-2"
                      value={editForm.sku}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Database className="h-3.5 w-3.5 text-amber-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Classification</label>
                    </div>
                    <Select value={editForm.isEbook ? 'ebook' : 'physical'} onValueChange={(v) => setEditForm(p => ({ ...p, isEbook: v === 'ebook' }))}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                        <SelectItem value="physical" className="rounded-xl py-3 font-bold">Physical</SelectItem>
                        <SelectItem value="ebook" className="rounded-xl py-3 font-bold">E-Book</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {programs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Layers className="h-3.5 w-3.5 text-violet-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Program Category <span className="normal-case font-medium">— optional</span></label>
                    </div>
                    <Select
                      value={editForm.programId || '__none__'}
                      onValueChange={(v) => setEditForm((p) => ({ ...p, programId: v === '__none__' ? null : v }))}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                        <SelectValue placeholder="Select program..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                        <SelectItem value="__none__" className="rounded-xl py-3 font-bold">None</SelectItem>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="rounded-xl py-3 font-bold">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Plus className="h-3.5 w-3.5 text-amber-500" />
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Refine Thumbnail</label>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 py-3.5 text-sm font-bold text-slate-900 focus:bg-white transition-all border-2 cursor-pointer file:mr-4 file:py-0 file:px-0 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-transparent file:text-amber-600"
                      onChange={(e) => setEditThumbnail(e.target.files?.[0] || null)}
                    />
                  </div>
                  {editForm.isEbook && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Download className="h-3.5 w-3.5 text-amber-500" />
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Update Source File</label>
                      </div>
                      <Input
                        type="file"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 py-3.5 text-sm font-bold text-slate-900 focus:bg-white transition-all border-2 cursor-pointer file:mr-4 file:py-0 file:px-0 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-transparent file:text-amber-600"
                        onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setEditDialogOpen(false)}>
              Discard
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-amber-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50" 
              onClick={handleEditSubmit} 
              disabled={editSubmitting}
            >
              {editSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Refinements'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Course Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <Link className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Link to Course</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Link this book to a course.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Target Course Program</label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                  <SelectValue placeholder="Search course registry..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                  {courses.map(c => <SelectItem key={c.id} value={c.id} className="rounded-xl py-3 font-bold">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 px-1">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all cursor-pointer",
                isFreeForCourse ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-transparent"
              )} onClick={() => setIsFreeForCourse(!isFreeForCourse)}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <label 
                className="text-sm font-black uppercase tracking-widest text-slate-600 cursor-pointer select-none"
                onClick={() => setIsFreeForCourse(!isFreeForCourse)}
              >
                Grant complementary access to enrolled students
              </label>
            </div>
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setLinkDialogOpen(false)}>
              Discard
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              onClick={handleLinkSubmit} 
              disabled={linkingSubmitting}
            >
              {linkingSubmitting ? 'Securing Link...' : 'Confirm Association'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Collaborators Dialog */}
      <Dialog open={collabDialogOpen} onOpenChange={setCollabDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Collaborators</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Manage who can edit this book.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6">
            {bookDetails?.collaborators && bookDetails.collaborators.length > 0 ? (
              <div className="space-y-3 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">Current team</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-xl"
                    onClick={async () => {
                      if (!bookDetails) return;
                      setRevenueSummaryLoading(true);
                      setShowRevenueDialog(true);
                      try {
                        const res = await getCollaboratorRevenue(bookDetails.id);
                        if (res.success && res.data) setRevenueSummary(res.data);
                      } finally {
                        setRevenueSummaryLoading(false);
                      }
                    }}
                  >
                    Revenue Summary
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(bookDetails.collaborators as any[]).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{c.user?.fullName || c.userId}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.role}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            placeholder="Revenue % (e.g. 20)"
                            className="w-36 h-8 rounded-xl border border-slate-200 px-3 text-sm"
                            value={revShareEdits[c.id] ?? (c.revenueSharePercent != null ? String(c.revenueSharePercent) : '')}
                            onChange={(e) => setRevShareEdits((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          />
                          <span className="text-xs text-slate-500">%</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-xl"
                            disabled={revShareSaving[c.id] || !revShareEdits[c.id]}
                            onClick={async () => {
                              if (!bookDetails || !revShareEdits[c.id]) return;
                              const pct = parseFloat(revShareEdits[c.id]);
                              if (isNaN(pct)) return;
                              setRevShareSaving((s) => ({ ...s, [c.id]: true }));
                              try {
                                const res = await updateCollaboratorRevShare(bookDetails.id, c.userId, pct);
                                if (res.success) {
                                  toast({ title: 'Saved', description: `Revenue share set to ${pct}%`, variant: 'success' });
                                  await fetchBookDetails(bookDetails.id);
                                  setRevShareEdits((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
                                } else {
                                  toast({ title: 'Error', description: res.message ?? 'Failed', variant: 'destructive' });
                                }
                              } catch (err) {
                                toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
                              } finally {
                                setRevShareSaving((s) => ({ ...s, [c.id]: false }));
                              }
                            }}
                          >
                            {revShareSaving[c.id] ? 'Saving...' : 'Set %'}
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={async () => {
                          if (!bookDetails) return;
                          try {
                            await removeBookCollaborator(bookDetails.id, c.userId);
                            toast({ title: 'Removed', variant: 'success' });
                            await fetchBookDetails(bookDetails.id);
                          } catch (err) {
                            toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                {(() => {
                  const totalPct = (bookDetails.collaborators as any[]).reduce((s: number, c: any) => s + Number(c.revenueSharePercent ?? 0), 0);
                  return (
                    <p className={`text-xs font-bold px-1 ${totalPct > 100 ? 'text-red-600' : 'text-slate-500'}`}>
                      Total allocated: {totalPct.toFixed(2)}% {totalPct > 100 ? '⚠️ Exceeds 100%' : totalPct === 100 ? '✓ Fully allocated' : `(${(100 - totalPct).toFixed(2)}% remaining)`}
                    </p>
                  );
                })()}
              </div>
            ) : null}

            {/* Single / Bulk tabs */}
            <Tabs defaultValue="single">
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="single">Add One</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
              </TabsList>

              {/* Single add */}
              <TabsContent value="single" className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Select Staff Member</label>
                  <Popover open={collabUserPopoverOpen} onOpenChange={setCollabUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-14 w-full justify-between rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2"
                      >
                        <span className={cn('truncate', !selectedUserId && 'text-slate-400')}>
                          {selectedUserId
                            ? (users.find((u) => u.id === selectedUserId)?.fullName || 'Selected user')
                            : 'Identify user account...'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) rounded-2xl border-slate-200 bg-white shadow-2xl p-2" align="start">
                      <div className="space-y-2">
                        <Input
                          placeholder="Search by name, email, or mobile..."
                          value={collabUserSearch}
                          onChange={(e) => setCollabUserSearch(e.target.value)}
                          className="h-10 rounded-xl"
                        />
                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {users
                            .filter((u) => u.role !== 'STUDENT' && u.status === 'ACTIVE')
                            .filter((u) => {
                              const q = collabUserSearch.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                (u.fullName || '').toLowerCase().includes(q) ||
                                (u.email || '').toLowerCase().includes(q) ||
                                (u.mobile || '').toLowerCase().includes(q)
                              );
                            })
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUserId(u.id);
                                  setCollabUserPopoverOpen(false);
                                }}
                                className={cn(
                                  'w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100',
                                  selectedUserId === u.id && 'bg-indigo-50 text-indigo-700'
                                )}
                              >
                                <p className="font-bold text-sm">{u.fullName}</p>
                                <p className="text-xs text-slate-500">{u.role} · {u.email || u.mobile || 'No contact'}</p>
                              </button>
                            ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Revenue Share (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={collabRevenueShare}
                    onChange={(e) => setCollabRevenueShare(e.target.value)}
                    placeholder="e.g. 20"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2"
                  />
                  <p className="text-xs text-slate-500 px-1">Optional now. You can also set per collaborator later from the list.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Role</label>
                  <Select value={collabRole} onValueChange={setCollabRole}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                      <SelectItem value="UPLOADER" className="rounded-xl py-3 font-bold">Uploader (File Management)</SelectItem>
                      <SelectItem value="EDITOR" className="rounded-xl py-3 font-bold">Editor (Full Metadata Control)</SelectItem>
                      <SelectItem value="VIEWER" className="rounded-xl py-3 font-bold">Viewer (ReadOnly Audit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
                    onClick={handleCollabSubmit}
                    disabled={collabSubmitting || !selectedUserId}
                  >
                    {collabSubmitting ? 'Saving...' : 'Add Collaborator'}
                  </Button>
                </div>
              </TabsContent>

              {/* Bulk add */}
              <TabsContent value="bulk" className="space-y-4">
                <div className="flex gap-2">
                  <Popover open={bulkUserPopoverOpen} onOpenChange={setBulkUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between h-10 rounded-xl font-medium">
                        <span className={cn('truncate', !bulkUserId && 'text-slate-400')}>
                          {bulkUserId ? users.find((u) => u.id === bulkUserId)?.fullName || 'User' : 'Select user...'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 rounded-xl p-2" align="start">
                      <Input
                        placeholder="Search..."
                        value={bulkUserSearch}
                        onChange={(e) => setBulkUserSearch(e.target.value)}
                        className="mb-2 h-9 rounded-lg"
                      />
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {users
                          .filter((u) => u.role !== 'STUDENT' && u.status === 'ACTIVE')
                          .filter((u) => {
                            const q = bulkUserSearch.toLowerCase().trim();
                            if (!q) return true;
                            return (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                          })
                          .map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => { setBulkUserId(u.id); setBulkUserPopoverOpen(false); }}
                              className={cn('w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-100', bulkUserId === u.id && 'bg-indigo-50')}
                            >
                              <p className="font-bold truncate">{u.fullName}</p>
                              <p className="text-[10px] text-slate-400">{u.role}</p>
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Select value={bulkRole} onValueChange={setBulkRole}>
                    <SelectTrigger className="w-32 h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPLOADER">Uploader</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min="0" max="100" placeholder="Rev%"
                    value={bulkRevShare}
                    onChange={(e) => setBulkRevShare(e.target.value)}
                    className="w-20 h-10 rounded-xl text-center"
                  />
                  <Button
                    size="sm"
                    className="h-10 px-3 rounded-xl"
                    disabled={!bulkUserId || bulkQueue.some((q) => q.userId === bulkUserId)}
                    onClick={() => {
                      if (!bulkUserId) return;
                      setBulkQueue((prev) => [...prev, {
                        userId: bulkUserId,
                        role: bulkRole,
                        revenueSharePercent: bulkRevShare ? Number(bulkRevShare) : undefined,
                      }]);
                      setBulkUserId('');
                      setBulkUserSearch('');
                      setBulkRevShare('');
                    }}
                  >
                    + Add
                  </Button>
                </div>

                {bulkQueue.length > 0 ? (
                  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Queue ({bulkQueue.length})</p>
                    {bulkQueue.map((item, idx) => {
                      const u = users.find((u) => u.id === item.userId);
                      return (
                        <div key={item.userId} className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-3 py-2">
                          <div>
                            <p className="text-sm font-bold">{u?.fullName ?? item.userId}</p>
                            <p className="text-[10px] text-slate-400">{item.role}{item.revenueSharePercent ? ` · ${item.revenueSharePercent}%` : ''}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBulkQueue((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-1">
                      <Button
                        className="h-10 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                        onClick={handleBulkSubmit}
                        disabled={bulkSubmitting}
                      >
                        {bulkSubmitting ? 'Saving...' : `Submit All (${bulkQueue.length})`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Queue is empty. Add users above to batch-add collaborators.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="px-10 py-5 shrink-0 bg-slate-50/50 border-t border-slate-100">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setCollabDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revenue Summary Dialog */}
      <Dialog open={showRevenueDialog} onOpenChange={setShowRevenueDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Book Collaborator Revenue Summary</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {revenueSummaryLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
            ) : revenueSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 border">
                    <p className="text-xs text-slate-500">Net Revenue</p>
                    <p className="text-lg font-bold">৳{revenueSummary.netRevenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border">
                    <p className="text-xs text-slate-500">Total Payable</p>
                    <p className="text-lg font-bold text-emerald-600">৳{revenueSummary.totalPayable.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{revenueSummary.invoiceItemCount} invoice item(s) counted</p>
                <div className="space-y-2">
                  {revenueSummary.collaborators.map((c) => (
                    <div key={c.collaboratorId} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="font-semibold text-sm">{c.user.fullName}</p>
                        <p className="text-xs text-slate-500">{c.role} · {c.revenueSharePercent}%</p>
                      </div>
                      <p className="font-bold text-emerald-600">৳{c.payableAmount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                {revenueSummary.collaborators.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No collaborators with revenue share set.</p>
                )}
                <p className="text-xs text-slate-400">Total allocated: {revenueSummary.totalAllocatedPercent}%</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No revenue data available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevenueDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Book Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-4xl flex flex-col p-0 gap-0 border-none bg-white shadow-2xl rounded-[40px] overflow-hidden">
          <DialogHeader className="px-10 pt-10 pb-6 shrink-0 relative overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 shadow-sm border border-slate-200">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Book Details</DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">View book details and linked courses.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
            {isDetailsReady && bookDetails && (
              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Details</h3>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Title</p>
                      <p className="mt-2 text-lg font-black text-slate-900 leading-tight">{bookDetails.name}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Author</p>
                      <p className="mt-2 text-lg font-black text-slate-900">{bookDetails.author || '—'}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">SKU</p>
                      <p className="mt-2 text-lg font-black text-slate-900 font-mono tracking-tighter">{bookDetails.sku}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Price</p>
                      <p className="mt-2 text-2xl font-black text-indigo-600 tabular-nums">৳{Number(bookDetails.price).toLocaleString()}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Description</h3>
                  </div>
                  <div className="rounded-[32px] border-2 border-slate-100 bg-slate-50/30 p-8">
                    <p className="text-base font-bold leading-relaxed text-slate-600">
                      {bookDetails.description || 'No description.'}
                    </p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Linked Courses</h3>
                  </div>
                  <div className="grid gap-4">
                    {bookDetails.courseBooks && bookDetails.courseBooks.length > 0 ? (
                      bookDetails.courseBooks.map((cb: any) => (
                        <div key={cb.id} className="flex items-center justify-between rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-base">{cb.course?.name}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code: {cb.course?.code}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "rounded-xl px-4 py-1.5 font-black uppercase tracking-widest text-[10px]",
                            cb.isFree ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {cb.isFree ? 'Free' : 'Paid'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/30">
                        <Link className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-300">Not linked to any course.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100">
            <Button className="h-14 w-full rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
