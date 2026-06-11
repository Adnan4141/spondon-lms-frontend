import type { Branch } from '@/lib/api/branches';

export function isHeadOfficeBranch(branch: { code?: string | null; name?: string }) {
  const code = (branch.code || '').trim().toUpperCase();
  const name = (branch.name || '').trim().toLowerCase();
  return code === 'HQ' || /head office|প্রধান কার্যালয়|headoffice/.test(name);
}

export function getSourceBranchOptions(branches: Branch[]) {
  return branches
    .filter((b) => b.status === 'active' && !isHeadOfficeBranch(b))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
