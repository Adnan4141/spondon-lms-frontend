'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COURSE_PLACEHOLDER, resolveMediaImageUrl } from '@/lib/image-url';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function CourseThumbnail({ src, alt, className, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaImageUrl(src, COURSE_PLACEHOLDER);
  const useFallback = failed || !src || resolved === COURSE_PLACEHOLDER;

  if (useFallback) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 via-slate-50 to-indigo-50/40',
          className,
        )}
        aria-hidden
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-slate-200/80">
          <BookOpen className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
        </div>
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes ?? '(max-width: 768px) 80px, 120px'}
      priority={priority}
      className={cn('object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
