'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createCourse,
  updateCourse,
  getCourses,
  getCourseContents,
  getAssociatedCourses,
  uploadCourseThumbnail,
  updateCourseContent,
} from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { ContentType } from '@/types/course-content';
import type { CreateCourseDto, UpdateCourseDto } from '@/types/course';
import type { CourseFormProps, FormState } from '../components/course-form-types';
import { defaultForm } from '../components/course-form-types';
import { buildCourseSubmitPayload, courseFormFromDetails } from '../components/course-form-submit';
import {
  groupContentBySubject,
  type CourseResourceRow,
} from '../components/course-form-content-utils';

export type CourseFormTab = 'basic' | 'content' | 'related';

export function useCourseForm({ programs, course, onSuccess }: CourseFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const isEdit = !!course;
  const pendingThumbnailFileRef = useRef<File | null>(null);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<CourseFormTab>('basic');
  const [resources, setResources] = useState<CourseResourceRow[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingResource, setEditingResource] = useState<CourseResourceRow | null>(null);
  const [addingToChapter, setAddingToChapter] = useState<string | null>(null);
  const [addingChapterOrder, setAddingChapterOrder] = useState<number | null>(null);
  const [addingSubjectTitle, setAddingSubjectTitle] = useState<string | null>(null);
  const [subjectRenaming, setSubjectRenaming] = useState(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean; subject: string }>({
    open: false,
    subject: '',
  });
  const [renameInput, setRenameInput] = useState('');

  const fetchExtras = useCallback(async () => {
    if (!course?.id) return;
    try {
      const [resRes, assocRes, coursesRes] = await Promise.all([
        getCourseContents({ courseId: course.id }),
        getAssociatedCourses({ fromCourseId: course.id }),
        getCourses({}),
      ]);
      if (resRes.success) setResources(resRes.data || []);
      if (assocRes.success) setAssociations(assocRes.data || []);
      if (coursesRes.success) setAllCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [course?.id]);

  useEffect(() => {
    if (!course) return;
    setForm(courseFormFromDetails(course));
    if (course.thumbnail) {
      setThumbnailPreview(resolveAttachmentUrl(course.thumbnail, API_ORIGIN));
    }
    void fetchExtras();
  }, [course, fetchExtras]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setThumbnailPreview(localUrl);
    if (isEdit && course) {
      try {
        setThumbnailUploading(true);
        const res = await uploadCourseThumbnail(course.id, file);
        if (res.success && res.data?.thumbnail) {
          const stored = res.data.thumbnail;
          setForm((prev) => ({ ...prev, thumbnail: stored }));
          setThumbnailPreview(resolveAttachmentUrl(stored, API_ORIGIN));
          toast({ title: 'Thumbnail uploaded', variant: 'success' });
        }
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
        setThumbnailPreview(
          form.thumbnail ? resolveAttachmentUrl(form.thumbnail, API_ORIGIN) : null,
        );
      } finally {
        setThumbnailUploading(false);
      }
    } else {
      setForm((prev) => ({ ...prev, thumbnail: '' }));
      pendingThumbnailFileRef.current = file;
    }
  };

  const clearThumbnail = () => {
    setThumbnailPreview(null);
    setForm((p) => ({ ...p, thumbnail: '' }));
    pendingThumbnailFileRef.current = null;
  };

  const isSubjectOpen = (k: string) => expandedSubjects[k] === true;
  const toggleSubject = (k: string) =>
    setExpandedSubjects((prev) => ({ ...prev, [k]: !isSubjectOpen(k) }));
  const isChapterOpen = (k: string) => expandedChapters[k] === true;
  const toggleChapter = (k: string) =>
    setExpandedChapters((prev) => ({ ...prev, [k]: !isChapterOpen(k) }));

  const startRename = (subject: string) => {
    setRenameInput(subject === 'General' ? '' : subject);
    setRenameModal({ open: true, subject });
  };

  const submitRename = async () => {
    const oldKey = renameModal.subject === 'General' ? '' : renameModal.subject;
    const trimmed = renameInput.trim();
    if (trimmed === oldKey.trim()) {
      setRenameModal({ open: false, subject: '' });
      return;
    }
    try {
      setSubjectRenaming(true);
      const targets = resources.filter((r) => (r.subjectTitle || '').trim() === oldKey);
      await Promise.all(
        targets.map((r) => {
          const fd = new FormData();
          fd.append('subjectTitle', trimmed);
          return updateCourseContent(r.id, fd);
        }),
      );
      toast({ title: 'Subject renamed', variant: 'success' });
      await fetchExtras();
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' });
    } finally {
      setSubjectRenaming(false);
      setRenameModal({ open: false, subject: '' });
    }
  };

  const contentBySubject = useMemo(() => groupContentBySubject(resources), [resources]);

  const togglePublicCurriculumType = (t: ContentType) => {
    setForm((prev) => {
      const has = prev.publicCurriculumTypes.includes(t);
      if (has && prev.publicCurriculumTypes.length <= 1) {
        toast({ title: 'At least one type required', variant: 'destructive' });
        return prev;
      }
      return {
        ...prev,
        publicCurriculumTypes: has
          ? prev.publicCurriculumTypes.filter((x) => x !== t)
          : [...prev.publicCurriculumTypes, t],
      };
    });
  };

  const handleSubmit = async () => {
    const result = buildCourseSubmitPayload(form, programs, course);
    if (result.ok === false) {
      setError(result.error);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (isEdit && course) {
        await updateCourse(course.id, result.payload as UpdateCourseDto);
      } else {
        const res = await createCourse(result.payload as CreateCourseDto);
        if (res.success && res.data) {
          const pendingFile = pendingThumbnailFileRef.current;
          if (pendingFile && res.data.id) {
            try {
              await uploadCourseThumbnail(res.data.id, pendingFile);
            } catch {
              /* non-fatal */
            }
            pendingThumbnailFileRef.current = null;
          }
          toast({ title: 'Course created successfully', variant: 'success' });
          closeModal();
          await onSuccess();
          return;
        }
      }
      toast({ title: isEdit ? 'Changes saved' : 'Course created', variant: 'success' });
      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} course`;
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const closeResourceForm = () => {
    setShowResourceForm(false);
    setEditingResource(null);
    setAddingToChapter(null);
    setAddingChapterOrder(null);
    setAddingSubjectTitle(null);
  };

  const openNewChapter = () => {
    setEditingResource(null);
    setAddingToChapter(null);
    setAddingChapterOrder(null);
    setAddingSubjectTitle(null);
    setShowResourceForm(true);
  };

  return {
    programs,
    course,
    isEdit,
    form,
    setForm,
    submitting,
    error,
    thumbnailUploading,
    thumbnailPreview,
    activeTab,
    setActiveTab,
    resources,
    associations,
    allCourses,
    showResourceForm,
    setShowResourceForm,
    showAssociationForm,
    setShowAssociationForm,
    editingResource,
    setEditingResource,
    addingToChapter,
    setAddingToChapter,
    addingChapterOrder,
    setAddingChapterOrder,
    addingSubjectTitle,
    setAddingSubjectTitle,
    subjectRenaming,
    renameModal,
    setRenameModal,
    renameInput,
    setRenameInput,
    contentBySubject,
    fetchExtras,
    handleThumbnailUpload,
    clearThumbnail,
    isSubjectOpen,
    toggleSubject,
    isChapterOpen,
    toggleChapter,
    startRename,
    submitRename,
    togglePublicCurriculumType,
    handleSubmit,
    closeModal,
    closeResourceForm,
    openNewChapter,
  };
}

export type CourseFormController = ReturnType<typeof useCourseForm>;
