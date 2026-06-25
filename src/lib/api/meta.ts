import { apiRequest } from '../api';

export interface AdminFilterProgram {
  id: string;
  name: string;
  paymentCircle: 'MONTHLY' | 'ONE_TIME';
  admissionFeeEnabled: boolean;
  admissionFeeAmount: number;
}

export interface AdminFilterBranch {
  id: string;
  name: string;
}

export interface AdminFilterCourse {
  id: string;
  name: string;
  programId: string;
  fee: number;
  offerPrice: number | null;
  type: 'ONLINE' | 'OFFLINE';
  startMonth: string;
  endMonth: string;
}

export interface AdminFiltersData {
  programs: AdminFilterProgram[];
  branches: AdminFilterBranch[];
  courses: AdminFilterCourse[];
}

export interface AdminFiltersResponse {
  success: boolean;
  data: AdminFiltersData;
}

export async function getAdminFilters(
  opts?: { allBranches?: boolean },
): Promise<AdminFiltersResponse> {
  const qs = opts?.allBranches ? '?allBranches=true' : '';
  return apiRequest<AdminFiltersResponse>(`/meta/admin-filters${qs}`);
}
