import { getBranches } from '@/lib/api/branches';
import BranchesPageClient from './page.client';

export default async function BranchesPage() {
  let initialBranches: Awaited<ReturnType<typeof getBranches>>['data'] = [];

  try {
    const res = await getBranches();
    if (res.success && res.data) {
      initialBranches = res.data;
    }
  } catch {
    initialBranches = [];
  }

  return <BranchesPageClient initialBranches={initialBranches ?? []} />;
}
