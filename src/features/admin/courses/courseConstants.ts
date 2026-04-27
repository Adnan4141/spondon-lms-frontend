import type { ContentType } from '@/types/course-content';

export const RED = '#c8102e';

export const TYPE_CONFIG: Record<ContentType, { label: string; textColor: string; bg: string }> = {
  VIDEO:    { label: 'Video',    textColor: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  NOTE:     { label: 'Note',     textColor: 'text-blue-600',   bg: 'bg-blue-50'   },
  PDF:      { label: 'PDF',      textColor: 'text-violet-600', bg: 'bg-violet-50' },
  SYLLABUS: { label: 'Syllabus', textColor: 'text-emerald-600',bg: 'bg-emerald-50'},
  LEAFLET:  { label: 'Leaflet',  textColor: 'text-amber-600',  bg: 'bg-amber-50'  },
  SAMPLE:   { label: 'Sample',   textColor: 'text-cyan-600',   bg: 'bg-cyan-50'   },
  OTHER:    { label: 'Other',    textColor: 'text-slate-500',  bg: 'bg-slate-100' },
};

export const CONTENT_TYPES: ContentType[] = ['VIDEO', 'NOTE', 'PDF', 'SYLLABUS', 'LEAFLET', 'SAMPLE', 'OTHER'];
