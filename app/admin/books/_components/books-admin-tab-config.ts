import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Boxes,
  CreditCard,
  RadioTower,
  ReceiptText,
  Tags,
} from 'lucide-react';

export const BOOKS_ADMIN_TABS = [
  { value: 'catalog', label: 'Catalog', icon: BookOpen },
  { value: 'categories', label: 'Categories', icon: Tags },
  { value: 'stock', label: 'Stock history', icon: Boxes },
  { value: 'distribution', label: 'Distribution', icon: ArrowRightLeft },
  { value: 'channels', label: 'Channels & sources', icon: RadioTower },
  { value: 'offline-sales', label: 'Offline sales', icon: CreditCard },
  { value: 'online-sales', label: 'Online sales', icon: BarChart3 },
  { value: 'commerce', label: 'Course commerce', icon: ReceiptText },
] as const satisfies ReadonlyArray<{ value: string; label: string; icon: LucideIcon }>;

export type BooksAdminTabValue = (typeof BOOKS_ADMIN_TABS)[number]['value'];
