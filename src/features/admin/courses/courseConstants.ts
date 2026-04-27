import type { ContentType } from '@/types/course-content';
import {
  ClipboardList,
  FileText,
  FlaskConical,
  type LucideIcon,
  Newspaper,
  Paperclip,
  PlayCircle,
  StickyNote,
} from 'lucide-react';

export const RED = '#c8102e';

export const TYPE_CONFIG: Record<ContentType, { label: string; textColor: string; bg: string; icon: LucideIcon; accent: string }> = {
  VIDEO:    { label: 'Video Lesson',  textColor: 'text-indigo-600',  bg: 'bg-indigo-50',  icon: PlayCircle,   accent: '#6366f1' },
  NOTE:     { label: 'Written Note',  textColor: 'text-blue-600',    bg: 'bg-blue-50',    icon: StickyNote,   accent: '#2563eb' },
  PDF:      { label: 'PDF Document',  textColor: 'text-violet-600',  bg: 'bg-violet-50',  icon: FileText,     accent: '#7c3aed' },
  SYLLABUS: { label: 'Syllabus',      textColor: 'text-emerald-600', bg: 'bg-emerald-50', icon: ClipboardList,accent: '#059669' },
  LEAFLET:  { label: 'Leaflet',       textColor: 'text-amber-600',   bg: 'bg-amber-50',   icon: Newspaper,    accent: '#d97706' },
  SAMPLE:   { label: 'Sample',        textColor: 'text-cyan-600',    bg: 'bg-cyan-50',    icon: FlaskConical, accent: '#0891b2' },
  OTHER:    { label: 'Other',         textColor: 'text-slate-500',   bg: 'bg-slate-100',  icon: Paperclip,    accent: '#64748b' },
};

export const CONTENT_TYPES: ContentType[] = ['VIDEO', 'NOTE', 'PDF', 'SYLLABUS', 'LEAFLET', 'SAMPLE', 'OTHER'];
