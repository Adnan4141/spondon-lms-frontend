import { apiRequest } from '../api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type OmrTestGeometry = {
  solverVersion: number;
  layoutVersion: string;
  questionCount: number;
  optionCount: number;
  columns: number;
  rowsPerColumn: number;
  bubbleSizePt: number;
  rowHeightPt: number;
  columnWidthPt: number;
  totalWidthPt: number;
  answerAreaTopPt: number;
  answerStartXPt: number;
  answerStartYPt: number;
};

export type OmrTestPrefillIssue = {
  field: string;
  reason: string;
  studentUserId?: string;
};

export type OmrTestPreviewBody = {
  examTitle: string;
  instituteName?: string;
  questionCount: number;
  optionCount: 3 | 4 | 5;
  setLabel?: string;
  examId?: string;
  studentUserId?: string;
  student: {
    fullName?: string;
    registrationNumber?: string;
    branchCode?: string;
  };
};

export type OmrTestPreviewResponse = {
  id: string;
  pdfUrl: string;
  layoutVersion: string;
  geometry: OmrTestGeometry;
  warnings: string[];
  prefillIssues: OmrTestPrefillIssue[];
  createdAt: string;
  sourceId?: string;
};

export type OmrTestFileItem = {
  id: string;
  filename: string;
  pdfUrl: string;
  createdAt: string;
  config: OmrTestPreviewBody;
  geometry: OmrTestGeometry;
  warnings: string[];
  prefillIssues: OmrTestPrefillIssue[];
  sizeBytes: number;
};

export async function getOmrTestStatus(): Promise<ApiResponse<{ enabled: boolean }>> {
  return apiRequest<ApiResponse<{ enabled: boolean }>>('/test/omr/status');
}

export async function listOmrTestFiles(): Promise<ApiResponse<{ files: OmrTestFileItem[]; total: number }>> {
  return apiRequest<ApiResponse<{ files: OmrTestFileItem[]; total: number }>>('/test/omr/files');
}

export async function previewOmrSheet(
  body: OmrTestPreviewBody,
): Promise<ApiResponse<OmrTestPreviewResponse>> {
  return apiRequest<ApiResponse<OmrTestPreviewResponse>>('/test/omr/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function regenerateOmrTestFile(
  id: string,
): Promise<ApiResponse<OmrTestPreviewResponse>> {
  return apiRequest<ApiResponse<OmrTestPreviewResponse>>(`/test/omr/files/${encodeURIComponent(id)}/regenerate`, {
    method: 'POST',
  });
}

export async function deleteOmrTestFile(id: string): Promise<ApiResponse<{ id: string }>> {
  return apiRequest<ApiResponse<{ id: string }>>(`/test/omr/files/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function deleteAllOmrTestFiles(): Promise<ApiResponse<{ deleted: number }>> {
  return apiRequest<ApiResponse<{ deleted: number }>>('/test/omr/files', {
    method: 'DELETE',
  });
}
