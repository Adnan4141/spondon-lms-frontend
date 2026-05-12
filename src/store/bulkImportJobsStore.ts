import { create } from 'zustand';

export type BulkImportJobUi = {
  jobId: string;
  jobType: 'students' | 'questions';
  totalRows: number;
  processedRows: number;
  createdCount: number;
  passageCount: number;
  errorCount: number;
  status: string;
  finished: boolean;
  folderId?: string | null;
  originalName?: string | null;
};

type Store = {
  jobs: BulkImportJobUi[];
  addJob: (j: Pick<BulkImportJobUi, 'jobId' | 'jobType' | 'totalRows' | 'originalName' | 'folderId'>) => void;
  patchJob: (jobId: string, patch: Partial<BulkImportJobUi>) => void;
  dismissJob: (jobId: string) => void;
};

export const useBulkImportJobsStore = create<Store>((set) => ({
  jobs: [],
  addJob: (j) =>
    set((s) => ({
      jobs: [
        ...s.jobs,
        {
          ...j,
          processedRows: 0,
          createdCount: 0,
          passageCount: 0,
          errorCount: 0,
          status: 'QUEUED',
          finished: false,
        },
      ],
    })),
  patchJob: (jobId, patch) =>
    set((s) => ({
      jobs: s.jobs.map((x) => (x.jobId === jobId ? { ...x, ...patch } : x)),
    })),
  dismissJob: (jobId) => set((s) => ({ jobs: s.jobs.filter((x) => x.jobId !== jobId) })),
}));
