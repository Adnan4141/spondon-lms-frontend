import type {
  AdmissionStatus,
  CourseDetails,
  CourseStatus,
  CourseType,
  CourseWebsiteSection,
  Program,
} from '@/types/course';
import type { ContentType } from '@/types/course-content';
import { DEFAULT_PUBLIC_CURRICULUM_TYPES } from '@/types/course';

export const statusOptions: CourseStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
export const typeOptions: CourseType[] = ['ONLINE', 'OFFLINE'];
export const gradeOptions = ['SSC', 'HSC', 'Admission', 'Junior', 'Cadet', 'Job'] as const;
export const groupOptions = ['Science', 'Commerce', 'Arts'] as const;

export function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const DEFAULT_BENEFITS = [
  'অভিজ্ঞ শিক্ষক মন্ডলী',
  'মানসম্মত লেকচার শিট',
  'নিয়মিত মডেল টেস্ট',
  'সাপ্তাহিক সলভ ক্লাস',
];

export type FormState = {
  programId: string;
  name: string;
  slug: string;
  thumbnail: string;
  type: CourseType;
  fee: string;
  offerPrice: string;
  description: string;
  status: CourseStatus;
  admissionStatus: AdmissionStatus;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  settledOptionEnabled: boolean;
  grade: string;
  group: string;
  startMonth: string;
  durationMonths: string;
  bookPrice: string;
  benefits: string[];
  websiteSections: CourseWebsiteSection[];
  publicShowBenefits: boolean;
  publicShowWebsiteSections: boolean;
  publicShowBooks: boolean;
  publicShowCurriculum: boolean;
  publicCurriculumTypes: ContentType[];
};

export const defaultForm: FormState = {
  programId: '',
  name: '',
  slug: '',
  thumbnail: '',
  type: 'ONLINE',
  fee: '0',
  offerPrice: '',
  description: '',
  status: 'ACTIVE',
  admissionStatus: 'OPEN',
  featured: false,
  websiteVisible: true,
  enrollmentVisible: true,
  settledOptionEnabled: false,
  grade: '',
  group: '',
  startMonth: '',
  durationMonths: '',
  bookPrice: '',
  benefits: DEFAULT_BENEFITS,
  websiteSections: [],
  publicShowBenefits: true,
  publicShowWebsiteSections: true,
  publicShowBooks: true,
  publicShowCurriculum: true,
  publicCurriculumTypes: [...DEFAULT_PUBLIC_CURRICULUM_TYPES],
};

export interface CourseFormProps {
  programs: Program[];
  course?: CourseDetails | null;
  onSuccess: () => Promise<void>;
}
