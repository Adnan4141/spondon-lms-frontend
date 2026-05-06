import type { LucideIcon } from 'lucide-react';

export type BookFormTabKey = 'identity' | 'commerce' | 'story' | 'media';

export type BookFormTabMeta = {
  value: BookFormTabKey;
  title: string;
  summary: string;
  description: string;
  badgeText: string;
  complete: boolean;
  icon: LucideIcon;
};
