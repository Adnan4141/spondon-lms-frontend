'use client';

import dynamic from 'next/dynamic';

const TestimonialsPageContent = dynamic(
  () =>
    import('@/features/admin/testimonials/TestimonialsPageContent').then((m) => m.TestimonialsPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading testimonials…
      </div>
    ),
  },
);

export default function AdminTestimonialsPage() {
  return <TestimonialsPageContent />;
}
