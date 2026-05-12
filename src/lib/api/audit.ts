import { apiRequest } from '../api';

export interface AuditActor {
  id: string;
  fullName: string;
  role: string;
  branchId?: string | null;
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
  action?: string;
  from?: string;
  to?: string;
}

export interface AuditListResponse {
  success: boolean;
  data: AuditRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getAuditLogs(params?: AuditListParams): Promise<AuditListResponse> {
  const query = new URLSearchParams();

  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.actorUserId) query.set('actorUserId', params.actorUserId);
  if (params?.entityType) query.set('entityType', params.entityType);
  if (params?.action) query.set('action', params.action);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);

  const qs = query.toString();
  return apiRequest<AuditListResponse>(`/audit${qs ? `?${qs}` : ''}`);
}
