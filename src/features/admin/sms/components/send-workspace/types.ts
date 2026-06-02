import type { LucideIcon } from 'lucide-react';
import type { Branch } from '@/lib/api/branches';

export type Actor = { id?: string | null; role?: string | null; branchId?: string | null };
export type SendMethod = 'students' | 'bulk' | 'manual' | 'direct';
export type Option = { id: string; name: string; programId?: string };
export type BranchOption = Pick<Branch, 'id' | 'name'>;
export type WalletSelection = { scope: 'ORG' | 'BRANCH'; branchId?: string };
export type DirectRecipientMode = 'student' | 'raw';

export type MethodMeta = {
  label: string;
  icon: LucideIcon;
  context: string;
  type: string;
  source: string;
};
