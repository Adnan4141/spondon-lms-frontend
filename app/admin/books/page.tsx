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
  type Book,
  type CreateBookDto,
  type UpdateBookDto,
} from '@/lib/api/books';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getCourses } from '@/lib/api/courses';
import type { Course } from '@/types/course';
import { getUsers } from '@/lib/api/users';
import { cn } from '@/lib/utils';

type BookFilter = 'all' | 'physical' | 'ebook';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BooksPage() {
  const { toast, toasts, removeToast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<BookFilter>('all');

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
  const [collabRole, setCollabRole] = useState<string>('EDITOR');
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState<CreateBookDto>({
    name: '',
    sku: '',
    price: 0,
    author: '',
    description: '',
    isEbook: false,
    fileUrl: '',
    thumbnailUrl: '',
  });
  const [editForm, setEditForm] = useState<UpdateBookDto>({
    name: '',
    sku: '',
    price: 0,
    author: '',
    description: '',
    isEbook: false,
    fileUrl: '',
    thumbnailUrl: '',
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
      const [coursesRes, usersRes] = await Promise.all([
        getCourses({}),
        getUsers({ limit: 100 })
      ]);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
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
          author: book.author || '',
          description: book.description || '',
          isEbook: book.isEbook,
          fileUrl: book.fileUrl || '',
          thumbnailUrl: book.thumbnailUrl || '',
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
      title: 'Material Unlink',
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
      await addBookCollaborator({
        bookId: bookDetails.id,
        userId: selectedUserId,
        role: collabRole
      });
      toast({ title: 'Success', description: 'Collaborator added', variant: 'success' });
      setCollabDialogOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setCollabSubmitting(false);
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
        name: '', sku: '', price: 0, author: '', description: '', isEbook: false, fileUrl: '', thumbnailUrl: '',
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
      title: 'Material Purge',
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
    return matchesSearch && matchesType;
  });

  const totalBooks = books.length;
  const ebookCount = books.filter((b) => b.isEbook).length;
  const physicalCount = totalBooks - ebookCount;
  const totalStocks = books.reduce((sum, b) => sum + (b._count?.stocks || 0), 0);

  const isDetailsReady = !!bookDetails && !detailsLoading;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Asset Catalog', value: totalBooks, color: 'from-blue-600 to-cyan-500', icon: BookOpen },
          { label: 'Physical Print', value: physicalCount, color: 'from-emerald-600 to-teal-500', icon: Layers },
          { label: 'Digital Assets', value: ebookCount, color: 'from-purple-600 to-indigo-600', icon: FileText },
          { label: 'Stock Nodes', value: totalStocks, color: 'from-rose-600 to-pink-600', icon: Building2 },
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
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search materials by name or SKU identifier..."
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
                <SelectItem value="all" className="text-sm font-medium">All Assets</SelectItem>
                <SelectItem value="physical" className="text-sm font-medium">Physical Books</SelectItem>
                <SelectItem value="ebook" className="text-sm font-medium">Digital E-Books</SelectItem>
              </SelectContent>
            </Select>

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
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Authorize Material
            </Button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Inventory Registry</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Asset catalog and material metadata</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalBooks} Registered Items
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Repository...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No materials identified in catalog.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Material Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Financials</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Digital Access</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Usage Metrics</TableHead>
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
                               <img src={book.thumbnailUrl} alt={book.name} className="h-full w-full object-cover" />
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
                          <span className="text-[10px] font-black uppercase text-slate-400">Fixed Rate</span>
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
                          <div className="flex items-center gap-1.5" title="Active Stock Nodes">
                             <Building2 className="h-3.5 w-3.5 text-slate-400" />
                             {book._count?.stocks || 0}
                          </div>
                          <div className="flex items-center gap-1.5" title="Total Lifetime Sales">
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
                            onClick={() => { setBookDetails(book); setCollabDialogOpen(true); }}
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
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Authorize Material</DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">Initialize a new high-fidelity material record in the catalog.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            <div className="space-y-8 py-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Official Material Name *</label>
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
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Author / Intellectual Property</label>
                  </div>
                  <Input
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2"
                    value={createForm.author || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="Primary contributor name"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Standard Price (BDT)</label>
                  </div>
                  <Input
                    type="number"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-base font-black text-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border-2"
                    value={createForm.price}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Asset Summary & Description</label>
                </div>
                <textarea
                  className="w-full rounded-3xl border-2 border-slate-200 bg-slate-50/30 px-5 py-4 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px] outline-none leading-relaxed"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize the key contents and academic value of this material..."
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Inventory SKU *</label>
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
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Resource Classification</label>
                  </div>
                  <Select value={createForm.isEbook ? 'ebook' : 'physical'} onValueChange={(v) => setCreateForm(p => ({ ...p, isEbook: v === 'ebook' }))}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                      <SelectItem value="physical" className="rounded-xl py-3 font-bold">Physical Print Material</SelectItem>
                      <SelectItem value="ebook" className="rounded-xl py-3 font-bold">Digital E-Book Asset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Plus className="h-3.5 w-3.5 text-indigo-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Thumbnail Display</label>
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
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Source Digital File</label>
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
                  <span>Authorizing...</span>
                </div>
              ) : (
                'Register Material'
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
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Refine Material</DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">Update the parameters and availability of existing catalog assets.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-10 no-scrollbar">
            {isDetailsReady && (
              <div className="space-y-8 py-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Material Name *</label>
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
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Author Reference</label>
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
                        <SelectItem value="physical" className="rounded-xl py-3 font-bold">Physical Print Material</SelectItem>
                        <SelectItem value="ebook" className="rounded-xl py-3 font-bold">Digital E-Book Asset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                  <span>Synchronizing...</span>
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
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Academic Linkage</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Associate this material with a specific course curriculum.</DialogDescription>
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
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Resource Collaboration</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">Delegate administrative permissions for this material.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Select Staff Member</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 px-5 font-bold text-slate-700 border-2">
                  <SelectValue placeholder="Identify user account..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2">
                  {users.filter(u => u.role !== 'STUDENT').map(u => (
                    <SelectItem key={u.id} value={u.id} className="rounded-xl py-3 font-bold">{u.fullName} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Authorization Level</label>
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
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all" onClick={() => setCollabDialogOpen(false)}>
              Discard
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              onClick={handleCollabSubmit} 
              disabled={collabSubmitting}
            >
              {collabSubmitting ? 'Authorizing...' : 'Assign Permissions'}
            </Button>
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
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Material Intelligence</DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">Complete architectural overview of asset metadata and linkage.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
            {isDetailsReady && bookDetails && (
              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Core Metadata Portfolio</h3>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Official Title</p>
                      <p className="mt-2 text-lg font-black text-slate-900 leading-tight">{bookDetails.name}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Author / Contributor</p>
                      <p className="mt-2 text-lg font-black text-slate-900">{bookDetails.author || 'Institutional Asset'}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">SKU Reference</p>
                      <p className="mt-2 text-lg font-black text-slate-900 font-mono tracking-tighter">{bookDetails.sku}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Standard Unit Price</p>
                      <p className="mt-2 text-2xl font-black text-indigo-600 tabular-nums">৳{Number(bookDetails.price).toLocaleString()}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Content Summary</h3>
                  </div>
                  <div className="rounded-[32px] border-2 border-slate-100 bg-slate-50/30 p-8">
                    <p className="text-base font-bold leading-relaxed text-slate-600">
                      {bookDetails.description || 'No detailed description available for this material.'}
                    </p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Institutional Linkages</h3>
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
                            {cb.isFree ? 'Complementary' : 'Standard Material'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/30">
                        <Link className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-300">No active course linkages detected.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
          <DialogFooter className="px-10 py-8 shrink-0 bg-slate-50/50 border-t border-slate-100">
            <Button className="h-14 w-full rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all" onClick={() => setViewDialogOpen(false)}>
              Secure Overview Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
