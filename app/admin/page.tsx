import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const QUICK_LINKS: {
  href: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    href: '/admin/reports',
    title: 'Reports & analytics',
    description: 'Financial dashboards, enrollment, transactions, and ledgers.',
    icon: BarChart3,
  },
  {
    href: '/admin/students',
    title: 'Students',
    description: 'Search profiles, enrollments, and academic records.',
    icon: Users,
  },
  {
    href: '/admin/courses',
    title: 'Courses',
    description: 'Programs, batches, and course administration.',
    icon: GraduationCap,
  },
  {
    href: '/admin/exam',
    title: 'Exams',
    description: 'Exam hub, schedules, and results workflows.',
    icon: ClipboardList,
  },
  {
    href: '/admin/books',
    title: 'Books',
    description: 'Inventory, orders, and book sales.',
    icon: BookOpen,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Jump to common admin areas or use the sidebar for full navigation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base group-hover:underline">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
