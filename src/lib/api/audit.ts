import { apiRequest } from '../api';

export type ActorRoleGroup = 'admin' | 'portal' | 'all';

export type AuditActorRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_ADMIN'
  | 'STUDENT'
  | 'TEACHER'
  | 'ACCOUNTS'
  | 'MODERATOR'
  | '';

export interface AuditActor {
  id: string;
  fullName: string;
  role: string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
}

export interface AuditRow {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
  createdAt: string;
  actor?: AuditActor | null;
}

export interface AuditListParams {
  page?: number;
  limit?: number;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
  actorRoleGroup?: ActorRoleGroup;
  actorRole?: string;
  branchId?: string;
}

export interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  from: number;
  to: number;
}

export interface AuditListResponse {
  success: boolean;
  data: AuditRow[];
  pagination: AuditPagination;
}

export async function getAuditLogs(params?: AuditListParams): Promise<AuditListResponse> {
  const query = new URLSearchParams();

  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.actorUserId) query.set('actorUserId', params.actorUserId);
  if (params?.entityType) query.set('entityType', params.entityType);
  if (params?.entityId) query.set('entityId', params.entityId);
  if (params?.action) query.set('action', params.action);
  if (params?.search) query.set('search', params.search);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.actorRole) query.set('actorRole', params.actorRole);
  if (params?.branchId) query.set('branchId', params.branchId);
  if (params?.actorRoleGroup && params.actorRoleGroup !== 'all') {
    query.set('actorRoleGroup', params.actorRoleGroup);
  }

  const qs = query.toString();
  return apiRequest<AuditListResponse>(`/audit${qs ? `?${qs}` : ''}`);
}
