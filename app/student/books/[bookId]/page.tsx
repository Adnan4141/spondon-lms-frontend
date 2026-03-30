'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Catalog details live on the public /books/[id] route (no student shell required). */
export default function StudentBookIdRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  useEffect(() => {
    if (bookId) router.replace(`/books/${bookId}`);
  }, [bookId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
      Redirecting…
    </div>
  );
}
