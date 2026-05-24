import Image from 'next/image';

export function SpondonLogo({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/images/logo/spondon_favicon.png"
      alt="Spondon logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
