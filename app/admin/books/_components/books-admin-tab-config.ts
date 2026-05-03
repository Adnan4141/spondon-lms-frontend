import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  BookOpen,
  Boxes,
  RadioTower,
  ReceiptText,
  ShoppingCart,
  Tags,
} from 'lucide-react';

export const BOOKS_ADMIN_TABS = [
  { value: 'catalog', label: 'Catalog', icon: BookOpen },
  { value: 'categories', label: 'Categories', icon: Tags },
  { value: 'stock', label: 'Stock history', icon: Boxes },
  { value: 'distribution', label: 'Distribution', icon: ArrowRightLeft },
  { value: 'channels', label: 'Channels & sources', icon: RadioTower },
  { value: 'sales', label: 'Offline sales', icon: ShoppingCart },
  { value: 'commerce', label: 'Course commerce', icon: ReceiptText },
] as const satisfies ReadonlyArray<{ value: string; label: string; icon: LucideIcon }>;

export type BooksAdminTabValue = (typeof BOOKS_ADMIN_TABS)[number]['value'];
