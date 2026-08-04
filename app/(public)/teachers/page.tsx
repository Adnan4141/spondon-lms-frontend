import { getPublicTeachers, type PublicTeacher } from '@/lib/api/teachers';
import TeachersPageClient from './page.client';

export default async function TeachersPage() {
  let teachers: PublicTeacher[] = [];

  try {
    const res = await getPublicTeachers();
    if (res.success && res.data) {
      teachers = res.data;
    }
  } catch {
    teachers = [];
  }

  return <TeachersPageClient initialTeachers={teachers} />;
}
