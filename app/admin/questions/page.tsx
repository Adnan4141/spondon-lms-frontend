'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getQuestionFolders,
  getQuestionFolderById,
  createQuestionFolder,
  updateQuestionFolder,
  deleteQuestionFolder,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getPassages,
  getPassageById,
  createPassage,
  updatePassage,
  deletePassage,
} from '@/lib/api/question-bank';
import { getCourses } from '@/lib/api/courses';
import type {
  Question,
  QuestionFolder,
  QuestionType,
  Difficulty,
  McqType,
  McqPassage,
  CreateQuestionFolderDto,
  UpdateQuestionFolderDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateMcqOptionDto,
} from '@/types/question';
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
  BookOpenCheck,
  Edit,
  Eye,
  Folder,
  FolderPlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { uploadQuestionImage } from '@/lib/api/question-bank';

const questionTypeOptions: QuestionType[] = ['MCQ', 'CQ'];
const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function QuestionsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');

  // Folder dialog states
  const [folderViewDialogOpen, setFolderViewDialogOpen] = useState(false);
  const [folderEditDialogOpen, setFolderEditDialogOpen] = useState(false);
  const [folderCreateDialogOpen, setFolderCreateDialogOpen] = useState(false);
  const [folderDetails, setFolderDetails] = useState<QuestionFolder | null>(null);
  const [folderForm, setFolderForm] = useState({ name: '', courseId: '', parentFolderId: '' });

  // Question dialog states
  const [questionViewDialogOpen, setQuestionViewDialogOpen] = useState(false);
  const [questionEditDialogOpen, setQuestionEditDialogOpen] = useState(false);
  const [questionCreateDialogOpen, setQuestionCreateDialogOpen] = useState(false);
  const [questionDetails, setQuestionDetails] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<CreateQuestionDto>({
    folderId: '',
    type: 'MCQ',
    mcqType: 'SINGLE',
    passageId: undefined,
    difficulty: undefined,
    year: undefined,
    prompt: '',
    explanation: '',
    tags: [],
    options: [],
  });
  const [mcqOptions, setMcqOptions] = useState<CreateMcqOptionDto[]>([]);

  // Passage dialog states
  const [passageListDialogOpen, setPassageListDialogOpen] = useState(false);
  const [passageEditDialogOpen, setPassageEditDialogOpen] = useState(false);
  const [passageCreateDialogOpen, setPassageCreateDialogOpen] = useState(false);
  const [passageDetails, setPassageDetails] = useState<McqPassage | null>(null);
  const [passageForm, setPassageForm] = useState<{
    folderId: string;
    title: string;
    content: string;
    difficulty?: Difficulty;
    year?: number;
    tags: string;
  }>({
    folderId: '',
    title: '',
    content: '',
    difficulty: undefined,
    year: undefined,
    tags: '',
  });

  // Refs to scroll MCQ options into view when adding new ones
  const createOptionsEndRef = useRef<HTMLDivElement | null>(null);
  const editOptionsEndRef = useRef<HTMLDivElement | null>(null);

  const loadFolders = async () => {
    try {
      const response = await getQuestionFolders();
      if (response.success && response.data) {
        setFolders(response.data);
      } else {
        setError(response.message || 'Failed to load folders');
        setFolders([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load folders');
      setFolders([]);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const folderId = selectedFolderId === 'all' ? undefined : selectedFolderId;
      const type = typeFilter === 'all' ? undefined : typeFilter;
      const difficulty = difficultyFilter === 'all' ? undefined : difficultyFilter;

      const response = await getQuestions(folderId, type, difficulty);
      if (response.success && response.data) {
        setQuestions(response.data);
      } else {
        setError(response.message || 'Failed to load questions');
        setQuestions([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadFolders();
    loadCourses();
    // Preload passages for selected folder later when opening passage list
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedFolderId, typeFilter, difficultyFilter]);

  const handleViewFolder = async (folderId: string) => {
    try {
      const response = await getQuestionFolderById(folderId);
      if (response.success && response.data) {
        setFolderDetails(response.data);
        setFolderViewDialogOpen(true);
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load folder details',
        variant: 'destructive',
      });
    }
  };

  const handleEditFolder = async (folderId: string) => {
    try {
      const response = await getQuestionFolderById(folderId);
      if (response.success && response.data) {
        setFolderDetails(response.data);
        setFolderForm({
          name: response.data.name,
          courseId: response.data.courseId || '',
          parentFolderId: response.data.parentFolderId || '',
        });
        setFolderEditDialogOpen(true);
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load folder details',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload: CreateQuestionFolderDto = {
        name: folderForm.name.trim(),
        courseId: folderForm.courseId || undefined,
        parentFolderId: folderForm.parentFolderId || undefined,
      };

      await createQuestionFolder(payload);
      setFolderCreateDialogOpen(false);
      setFolderForm({ name: '', courseId: '', parentFolderId: '' });
      await loadFolders();

      toast({
        title: 'Success',
        description: 'Folder created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFolder = async () => {
    if (!folderDetails || !folderForm.name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload: UpdateQuestionFolderDto = {
        name: folderForm.name.trim(),
        courseId: folderForm.courseId || undefined,
        parentFolderId: folderForm.parentFolderId || undefined,
      };

      await updateQuestionFolder(folderDetails.id, payload);
      setFolderEditDialogOpen(false);
      await loadFolders();

      toast({
        title: 'Success',
        description: 'Folder updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to update folder',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? All questions in this folder will also be deleted.')) {
      return;
    }

    try {
      await deleteQuestionFolder(folderId);
      await loadFolders();
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all');
      }

      toast({
        title: 'Success',
        description: 'Folder deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete folder',
        variant: 'destructive',
      });
    }
  };

  const handleViewQuestion = async (questionId: string) => {
    try {
      const response = await getQuestionById(questionId);
      if (response.success && response.data) {
        setQuestionDetails(response.data);
        setQuestionViewDialogOpen(true);
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load question details',
        variant: 'destructive',
      });
    }
  };

  const handleEditQuestion = async (questionId: string) => {
    try {
      const response = await getQuestionById(questionId);
      if (response.success && response.data) {
        setQuestionDetails(response.data);
        setQuestionForm({
          folderId: response.data.folderId,
          type: response.data.type,
          mcqType: (response.data.mcqType as McqType) || 'SINGLE',
          passageId: response.data.passageId || undefined,
          difficulty: response.data.difficulty || undefined,
          year: response.data.year || undefined,
          prompt: response.data.prompt,
          explanation: response.data.explanation || '',
          options: [],
        });
        setMcqOptions(
          response.data.options?.map((opt) => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })) || []
        );
        setQuestionEditDialogOpen(true);
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load question details',
        variant: 'destructive',
      });
    }
  };

  const handleCreateQuestion = async () => {
    if (!questionForm.folderId || !questionForm.prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Folder and prompt are required',
        variant: 'destructive',
      });
      return;
    }

    if (questionForm.type === 'MCQ') {
      if (mcqOptions.length !== 4 && mcqOptions.length !== 5) {
        toast({
          title: 'Error',
          description: 'MCQ questions must have exactly 4 or 5 options',
          variant: 'destructive',
        });
        return;
      }
      if (!mcqOptions.some((opt) => opt.isCorrect)) {
        toast({
          title: 'Error',
          description: 'MCQ questions must have at least one correct option',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const payload: CreateQuestionDto = {
        ...questionForm,
        options: questionForm.type === 'MCQ' ? mcqOptions : undefined,
      };

      await createQuestion(payload);
      setQuestionCreateDialogOpen(false);
      setQuestionForm({
        folderId: '',
        type: 'MCQ',
        mcqType: 'SINGLE',
        passageId: undefined,
        difficulty: undefined,
        year: undefined,
        prompt: '',
        explanation: '',
        options: [],
      });
      setMcqOptions([]);
      await loadQuestions();

      toast({
        title: 'Success',
        description: 'Question created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to create question',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!questionDetails || !questionForm.prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Prompt is required',
        variant: 'destructive',
      });
      return;
    }

    if (questionForm.type === 'MCQ') {
      if (mcqOptions.length !== 4 && mcqOptions.length !== 5) {
        toast({
          title: 'Error',
          description: 'MCQ questions must have exactly 4 or 5 options',
          variant: 'destructive',
        });
        return;
      }
      if (!mcqOptions.some((opt) => opt.isCorrect)) {
        toast({
          title: 'Error',
          description: 'MCQ questions must have at least one correct option',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const payload: UpdateQuestionDto = {
        ...questionForm,
        options: questionForm.type === 'MCQ' ? mcqOptions : undefined,
      };

      await updateQuestion(questionDetails.id, payload);
      setQuestionEditDialogOpen(false);
      await loadQuestions();

      toast({
        title: 'Success',
        description: 'Question updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to update question',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      await loadQuestions();

      toast({
        title: 'Success',
        description: 'Question deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };

  const addMcqOption = () => {
    setMcqOptions((prev) => {
      const next = [...prev, { label: '', text: '', isCorrect: false }];

      // Allow DOM to update, then scroll the last option into view in whichever dialog is open
      setTimeout(() => {
        if (questionCreateDialogOpen && createOptionsEndRef.current) {
          createOptionsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (questionEditDialogOpen && editOptionsEndRef.current) {
          editOptionsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 0);

      return next;
    });
  };

  const removeMcqOption = (index: number) => {
    setMcqOptions(mcqOptions.filter((_, i) => i !== index));
  };

  const updateMcqOption = (index: number, field: keyof CreateMcqOptionDto, value: string | boolean) => {
    const updated = [...mcqOptions];
    updated[index] = { ...updated[index], [field]: value };
    setMcqOptions(updated);
  };

  const filteredQuestions = questions.filter((q) =>
    q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.explanation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalQuestions = questions.length;
  const mcqCount = questions.filter((q) => q.type === 'MCQ').length;
  const cqCount = questions.filter((q) => q.type === 'CQ').length;
  const totalFolders = folders.length;

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
  };

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const response = await uploadQuestionImage(file);
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      throw new Error(response.message || 'Failed to upload image');
    } catch (err: unknown) {
      toast({
        title: 'Image upload failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
      throw err;
    }
  };

  const loadPassages = async () => {
    try {
      const folderId = selectedFolderId === 'all' ? undefined : selectedFolderId;
      const response = await getPassages(folderId);
      if (response.success && response.data) {
        setPassages(response.data);
      } else {
        setPassages([]);
      }
    } catch (err) {
      console.error('Failed to load passages', err);
      setPassages([]);
    }
  };

  const handleOpenPassageList = async () => {
    await loadPassages();
    setPassageListDialogOpen(true);
  };

  const handleCreatePassageSubmit = async () => {
    if (!passageForm.folderId || !passageForm.content.trim()) {
      toast({
        title: 'Error',
        description: 'Folder and passage content are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createPassage({
        folderId: passageForm.folderId,
        title: passageForm.title || undefined,
        content: passageForm.content,
        difficulty: passageForm.difficulty,
        year: passageForm.year,
        tags: passageForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setPassageCreateDialogOpen(false);
      setPassageForm({
        folderId: '',
        title: '',
        content: '',
        difficulty: undefined,
        year: undefined,
        tags: '',
      });
      await loadPassages();

      toast({
        title: 'Success',
        description: 'Passage created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to create passage',
        variant: 'destructive',
      });
    }
  };

  const handleEditPassage = async (id: string) => {
    try {
      const response = await getPassageById(id);
      if (response.success && response.data) {
        setPassageDetails(response.data);
        setPassageForm({
          folderId: response.data.folderId,
          title: response.data.title || '',
          content: response.data.content,
          difficulty: response.data.difficulty || undefined,
          year: response.data.year || undefined,
          tags: (response.data.tags || []).join(', '),
        });
        setPassageEditDialogOpen(true);
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to load passage',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePassageSubmit = async () => {
    if (!passageDetails) return;
    if (!passageForm.folderId || !passageForm.content.trim()) {
      toast({
        title: 'Error',
        description: 'Folder and passage content are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updatePassage(passageDetails.id, {
        folderId: passageForm.folderId,
        title: passageForm.title || undefined,
        content: passageForm.content,
        difficulty: passageForm.difficulty,
        year: passageForm.year,
        tags: passageForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setPassageEditDialogOpen(false);
      await loadPassages();

      toast({
        title: 'Success',
        description: 'Passage updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to update passage',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePassage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passage and all its child questions?')) return;
    try {
      await deletePassage(id);
      await loadPassages();
      toast({
        title: 'Success',
        description: 'Passage deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete passage',
        variant: 'destructive',
      });
    }
  };

  const startCreateChildQuestion = (passage: McqPassage) => {
    setPassageDetails(passage);
    setQuestionForm({
      folderId: passage.folderId,
      type: 'MCQ',
      mcqType: 'PASSAGE_CHILD',
      passageId: passage.id,
      difficulty: passage.difficulty || undefined,
      year: passage.year || undefined,
      prompt: '',
      explanation: '',
      tags: passage.tags || [],
      options: [],
    });
    setMcqOptions([
      { label: 'A', text: '', isCorrect: false },
      { label: 'B', text: '', isCorrect: false },
      { label: 'C', text: '', isCorrect: false },
      { label: 'D', text: '', isCorrect: false },
    ]);
    setQuestionCreateDialogOpen(true);
  };

  const isPassageChild = questionForm.mcqType === 'PASSAGE_CHILD' && questionForm.type === 'MCQ';

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Question Bank Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage question folders and questions for exams and assessments.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFolderCreateDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
            <Button variant="outline" onClick={handleOpenPassageList}>
              <BookOpenCheck className="mr-2 h-4 w-4" />
              Passage Sets
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setQuestionCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Question
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Questions</p>
          <p className="mt-2 text-2xl font-semibold">{totalQuestions}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">MCQ Questions</p>
          <p className="mt-2 text-2xl font-semibold">{mcqCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">CQ Questions</p>
          <p className="mt-2 text-2xl font-semibold">{cqCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Folders</p>
          <p className="mt-2 text-2xl font-semibold">{totalFolders}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions by prompt or explanation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
            <SelectTrigger className="h-10 w-[200px] border-border bg-background">
              <SelectValue placeholder="All Folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as QuestionType | 'all')}>
            <SelectTrigger className="h-10 w-[150px] border-border bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {questionTypeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as Difficulty | 'all')}>
            <SelectTrigger className="h-10 w-[150px] border-border bg-background">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              {difficultyOptions.filter((opt) => opt !== 'all').map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={loadQuestions}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      <section className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Question Bank</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all questions</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <BookOpenCheck className="h-4 w-4" />
            <span>{totalQuestions} Total Questions</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading questions...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No questions found matching your search.' : 'No questions found. Create your first question.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Type</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question.id} className="hover:bg-muted/45">
                  <TableCell>
                    <Badge variant={question.type === 'MCQ' ? 'default' : 'secondary'}>{question.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{stripHtml(question.prompt)}</TableCell>
                  <TableCell>
                    {question.difficulty ? (
                      <Badge variant="outline">{question.difficulty}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{question.year || '-'}</TableCell>
                  <TableCell>{question.folder?.name || '-'}</TableCell>
                  <TableCell>
                    {question.type === 'MCQ' ? (
                      <Badge variant="outline">{question.options?.length || 0} options</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewQuestion(question.id)} title="View Question">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question.id)} title="Edit Question">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                        title="Delete Question"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Folder View Dialog */}
      <Dialog open={folderViewDialogOpen} onOpenChange={setFolderViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Folder Details</DialogTitle>
            <DialogDescription>View folder information and statistics.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {folderDetails && (
              <div className="space-y-5 text-sm py-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Name</p>
                      <p className="mt-1 font-medium">{folderDetails.name}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Course</p>
                      <p className="mt-1 font-medium">{folderDetails.course?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Questions</p>
                      <p className="mt-1 font-medium">{folderDetails._count?.questions || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Subfolders</p>
                      <p className="mt-1 font-medium">{folderDetails._count?.children || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Created At</p>
                  <p className="mt-1 text-sm">
                    {new Date(folderDetails.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Create Dialog */}
      <Dialog open={folderCreateDialogOpen} onOpenChange={setFolderCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Create a new question folder to organize questions.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder Name *</label>
                <Input
                  value={folderForm.name}
                  onChange={(e) => setFolderForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Physics Chapter 1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course (Optional)</label>
                <Select
                  value={folderForm.courseId || undefined}
                  onValueChange={(v) => setFolderForm((prev) => ({ ...prev, courseId: v || '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Folder (Optional)</label>
                <Select
                  value={folderForm.parentFolderId || undefined}
                  onValueChange={(v) => setFolderForm((prev) => ({ ...prev, parentFolderId: v || '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setFolderCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Edit Dialog */}
      <Dialog open={folderEditDialogOpen} onOpenChange={setFolderEditDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update folder information.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder Name *</label>
                <Input
                  value={folderForm.name}
                  onChange={(e) => setFolderForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Physics Chapter 1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course (Optional)</label>
                <Select
                  value={folderForm.courseId || undefined}
                  onValueChange={(v) => setFolderForm((prev) => ({ ...prev, courseId: v || '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Folder (Optional)</label>
                <Select
                  value={folderForm.parentFolderId || undefined}
                  onValueChange={(v) => setFolderForm((prev) => ({ ...prev, parentFolderId: v || '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.filter((f) => f.id !== folderDetails?.id).map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setFolderEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question View Dialog */}
      <Dialog open={questionViewDialogOpen} onOpenChange={setQuestionViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>View complete question information.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {questionDetails && (
              <div className="space-y-5 text-sm py-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Question Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Type</p>
                      <p className="mt-1 font-medium">
                        <Badge variant={questionDetails.type === 'MCQ' ? 'default' : 'secondary'}>
                          {questionDetails.type}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Difficulty</p>
                      <p className="mt-1 font-medium">
                        {questionDetails.difficulty ? (
                          <Badge variant="outline">{questionDetails.difficulty}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Year</p>
                      <p className="mt-1 font-medium">{questionDetails.year || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Folder</p>
                      <p className="mt-1 font-medium">{questionDetails.folder?.name || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Prompt</p>
                  <div
                    className="mt-1 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: questionDetails.prompt }}
                  />
                </div>

                {questionDetails.explanation && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground">Explanation</p>
                    <div
                      className="mt-1 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: questionDetails.explanation }}
                    />
                  </div>
                )}

                {questionDetails.type === 'MCQ' && questionDetails.options && questionDetails.options.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Options</p>
                    <div className="space-y-2">
                      {questionDetails.options.map((option, idx) => (
                        <div
                          key={option.id}
                          className={`rounded-lg border p-3 ${option.isCorrect ? 'bg-green-50 border-green-200' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {option.label}. {option.text}
                              </p>
                            </div>
                            {option.isCorrect && (
                              <Badge variant="default" className="ml-2">
                                Correct
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Created At</p>
                    <p className="mt-1 text-sm">
                      {new Date(questionDetails.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Last Updated</p>
                    <p className="mt-1 text-sm">
                      {new Date(questionDetails.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Create Dialog */}
      <Dialog open={questionCreateDialogOpen} onOpenChange={setQuestionCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Question</DialogTitle>
            <DialogDescription>Add a new question to the question bank.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder *</label>
                <Select
                  value={questionForm.folderId}
                  onValueChange={(v) => setQuestionForm((prev) => ({ ...prev, folderId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <Select
                    value={questionForm.type}
                    onValueChange={(v) => {
                      setQuestionForm((prev) => ({ ...prev, type: v as QuestionType }));
                      if (v === 'CQ') setMcqOptions([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={questionForm.difficulty || undefined}
                    onValueChange={(v) => setQuestionForm((prev) => ({ ...prev, difficulty: (v || undefined) as Difficulty }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  value={questionForm.year || ''}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  placeholder="e.g., 2024"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt *</label>
                <RichTextEditor
                  value={questionForm.prompt}
                  onChange={(html) => setQuestionForm((prev) => ({ ...prev, prompt: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Enter the question prompt..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Explanation</label>
                <RichTextEditor
                  value={questionForm.explanation || ''}
                  onChange={(html) => setQuestionForm((prev) => ({ ...prev, explanation: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Enter explanation (optional)..."
                />
              </div>

              {questionForm.type === 'MCQ' && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">MCQ Options *</label>
                    <Button type="button" variant="outline" size="sm" onClick={addMcqOption}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                  {mcqOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        placeholder="Label (e.g., A, B, C)"
                        value={option.label}
                        onChange={(e) => updateMcqOption(idx, 'label', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Option text"
                        value={option.text}
                        onChange={(e) => updateMcqOption(idx, 'text', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant={option.isCorrect ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateMcqOption(idx, 'isCorrect', !option.isCorrect)}
                      >
                        Correct
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMcqOption(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div ref={createOptionsEndRef} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setQuestionCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestion}>Create Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Edit Dialog */}
      <Dialog open={questionEditDialogOpen} onOpenChange={setQuestionEditDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update question information.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder *</label>
                <Select
                  value={questionForm.folderId}
                  onValueChange={(v) => setQuestionForm((prev) => ({ ...prev, folderId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <Select
                    value={questionForm.type}
                    onValueChange={(v) => {
                      setQuestionForm((prev) => ({ ...prev, type: v as QuestionType }));
                      if (v === 'CQ') setMcqOptions([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={questionForm.difficulty || undefined}
                    onValueChange={(v) => setQuestionForm((prev) => ({ ...prev, difficulty: (v || undefined) as Difficulty }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  value={questionForm.year || ''}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  placeholder="e.g., 2024"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt *</label>
                <RichTextEditor
                  value={questionForm.prompt}
                  onChange={(html) => setQuestionForm((prev) => ({ ...prev, prompt: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Enter the question prompt..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Explanation</label>
                <RichTextEditor
                  value={questionForm.explanation || ''}
                  onChange={(html) => setQuestionForm((prev) => ({ ...prev, explanation: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Enter explanation (optional)..."
                />
              </div>

              {questionForm.type === 'MCQ' && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">MCQ Options *</label>
                    <Button type="button" variant="outline" size="sm" onClick={addMcqOption}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                  {mcqOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        placeholder="Label (e.g., A, B, C)"
                        value={option.label}
                        onChange={(e) => updateMcqOption(idx, 'label', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Option text"
                        value={option.text}
                        onChange={(e) => updateMcqOption(idx, 'text', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant={option.isCorrect ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateMcqOption(idx, 'isCorrect', !option.isCorrect)}
                      >
                        Correct
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMcqOption(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div ref={editOptionsEndRef} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setQuestionEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuestion}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passage List Dialog */}
      <Dialog open={passageListDialogOpen} onOpenChange={setPassageListDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Passage-based MCQ Sets</DialogTitle>
            <DialogDescription>Manage passages and their child MCQs.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-muted-foreground">
                Folder:{' '}
                {selectedFolderId === 'all'
                  ? 'All folders'
                  : folders.find((f) => f.id === selectedFolderId)?.name || 'Unknown'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setPassageForm((prev) => ({
                    ...prev,
                    folderId: selectedFolderId === 'all' ? '' : selectedFolderId,
                  }));
                  setPassageCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Passage
              </Button>
            </div>

            {passages.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No passages found in the selected folder.
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                {passages.map((passage) => (
                  <div key={passage.id} className="rounded-lg border bg-muted/10 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Passage</p>
                        <p className="mt-1 font-semibold">
                          {passage.title || '(Untitled Passage)'}
                        </p>
                        <div
                          className="mt-2 line-clamp-3 text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: passage.content }}
                        />
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                        <span>
                          {passage.difficulty || '-'} · {passage.year || '-'}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startCreateChildQuestion(passage)}
                            title="Add child MCQ"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPassage(passage.id)}
                            title="Edit passage"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePassage(passage.id)}
                            title="Delete passage"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {passage.questions && passage.questions.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Child MCQs
                        </p>
                        <ul className="space-y-2 text-sm">
                          {passage.questions.map((q) => (
                            <li key={q.id} className="flex items-center justify-between gap-2">
                              <span className="line-clamp-1">{stripHtml(q.prompt)}</span>
                              <span className="text-xs text-muted-foreground">
                                {q.options?.length || 0} options
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Passage Create Dialog */}
      <Dialog open={passageCreateDialogOpen} onOpenChange={setPassageCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Passage</DialogTitle>
            <DialogDescription>Create a passage that will be shared by multiple MCQs.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder *</label>
                <Select
                  value={passageForm.folderId}
                  onValueChange={(v) => setPassageForm((prev) => ({ ...prev, folderId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  value={passageForm.title}
                  onChange={(e) => setPassageForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Reading passage for Chapter 3"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={passageForm.difficulty || undefined}
                    onValueChange={(v) =>
                      setPassageForm((prev) => ({ ...prev, difficulty: (v || undefined) as Difficulty }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Input
                    type="number"
                    value={passageForm.year || ''}
                    onChange={(e) =>
                      setPassageForm((prev) => ({
                        ...prev,
                        year: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input
                  value={passageForm.tags}
                  onChange={(e) => setPassageForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., reading, grammar, chapter-3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Passage Content *</label>
                <RichTextEditor
                  value={passageForm.content}
                  onChange={(html) => setPassageForm((prev) => ({ ...prev, content: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Enter the passage text, images, graphs etc..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setPassageCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePassageSubmit}>Create Passage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passage Edit Dialog */}
      <Dialog open={passageEditDialogOpen} onOpenChange={setPassageEditDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Passage</DialogTitle>
            <DialogDescription>Update the passage content and metadata.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder *</label>
                <Select
                  value={passageForm.folderId}
                  onValueChange={(v) => setPassageForm((prev) => ({ ...prev, folderId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  value={passageForm.title}
                  onChange={(e) => setPassageForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Reading passage for Chapter 3"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={passageForm.difficulty || undefined}
                    onValueChange={(v) =>
                      setPassageForm((prev) => ({ ...prev, difficulty: (v || undefined) as Difficulty }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Input
                    type="number"
                    value={passageForm.year || ''}
                    onChange={(e) =>
                      setPassageForm((prev) => ({
                        ...prev,
                        year: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input
                  value={passageForm.tags}
                  onChange={(e) => setPassageForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., reading, grammar, chapter-3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Passage Content *</label>
                <RichTextEditor
                  value={passageForm.content}
                  onChange={(html) => setPassageForm((prev) => ({ ...prev, content: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Enter the passage text, images, graphs etc..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setPassageEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassageSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
