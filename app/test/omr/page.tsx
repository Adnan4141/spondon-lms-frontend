import type { Metadata } from 'next';
import { OmrTestPlayground } from '@/features/test/omr/OmrTestPlayground';

export const metadata: Metadata = {
  title: 'OMR Test Playground',
  robots: { index: false, follow: false },
};

export default function OmrTestPage() {
  return <OmrTestPlayground />;
}
