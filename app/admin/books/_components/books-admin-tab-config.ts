import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  RadioTower,
  ReceiptText,
  Tags,
} from 'lucide-react';

export const BOOKS_ADMIN_TABS = [
  { value: 'catalog', label: 'Catalog', icon: BookOpen },
  { value: 'categories', label: 'Categories', icon: Tags },
  { value: 'channels', label: 'Channels & sources', icon: RadioTower },
  { value: 'commerce', label: 'Course commerce', icon: ReceiptText },
] as const satisfies ReadonlyArray<{ value: string; label: string; icon: LucideIcon }>;

export type BooksAdminTabValue = (typeof BOOKS_ADMIN_TABS)[number]['value'];
