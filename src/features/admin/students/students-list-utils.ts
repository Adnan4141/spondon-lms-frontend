import type { getUsers } from '@/lib/api/users';
import type { Student } from '@/features/admin/students/types';

export function mapUsersToStudents(
  data: NonNullable<Awaited<ReturnType<typeof getUsers>>['data']>,
): Student[] {
  type ApiStudentUser = (typeof data)[0] & {
    studentProfile?: { registrationNumber?: string };
    _count?: { enrollments?: number };
  };
  return (data as ApiStudentUser[]).map((u) => ({
    id: u.id,
    regNo: u.studentProfile?.registrationNumber ?? '—',
    fullName: u.fullName,
    mobile: u.mobile,
    email: u.email ?? null,
    status: u.status as 'ACTIVE' | 'BLOCKED',
    branchId: u.branchId ?? '',
    createdAt: u.createdAt ?? '',
    _count: u._count,
  }));
}
