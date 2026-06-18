'use client';

import { useQuery } from '@tanstack/react-query';
import { getBatches } from '@/lib/api/batches';
import { queryKeys, type BatchesListParams } from '@/lib/query/admin-query';

export function useBatchesList(params: BatchesListParams | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.batches(params ?? {}),
    enabled: enabled && params !== null,
    queryFn: async () => {
      const res = await getBatches({ ...params!, all: true });
      if (!res.success) throw new Error('Failed to load batches');
      return res.data ?? [];
    },
  });
}

export function useBatchesForCourse(courseId: string | null) {
  return useQuery({
    queryKey: queryKeys.batchesForCourse(courseId ?? ''),
    enabled: Boolean(courseId),
    queryFn: async () => {
      const res = await getBatches({ courseId: courseId!, all: true });
      if (!res.success) throw new Error('Failed to load batches');
      return res.data ?? [];
    },
  });
}
