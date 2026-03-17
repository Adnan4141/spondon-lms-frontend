import { TeacherLayout } from '@/components/teacher/TeacherLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TeacherLayout>{children}</TeacherLayout>;
}
