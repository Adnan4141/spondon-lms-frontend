import Image from 'next/image';

export function MathlabLogo({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/images/logo/mathlab-icon.png"
      alt="Mathlab logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
