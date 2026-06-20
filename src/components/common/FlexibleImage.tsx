'use client';

import Image from 'next/image';
import { isNextImageHost } from '@/lib/image-url';
import { cn } from '@/lib/utils';

type FlexibleImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
};

export function FlexibleImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
  loading,
}: FlexibleImageProps) {
  if (!src) return null;

  if (isNextImageHost(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        sizes={sizes}
        priority={priority}
        loading={loading}
      />
    );
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn('absolute inset-0 h-full w-full', className)} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
    />
  );
}
