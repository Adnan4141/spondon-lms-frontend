export function isHeadOfficeBranch(branch: { code?: string | null; name?: string }) {
  const code = (branch.code || '').trim().toUpperCase();
  const name = (branch.name || '').trim().toLowerCase();
  return code === 'HQ' || /head office|প্রধান কার্যালয়|headoffice/.test(name);
}

export function getSourceBranchOptions(
  branches: Array<{ id: string; name: string; code?: string | null; status?: string; order?: number }>,
) {
  return branches
    .filter((b) => (b.status ?? 'active') === 'active' && !isHeadOfficeBranch(b))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}
