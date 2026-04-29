import { useEffect, useMemo, useState } from 'react';
import { getTrustFeatures, type TrustFeature } from '@/lib/api/site-content';

const FALLBACK_FEATURES = [
  { id: 'content', title: 'সেরা কনটেন্ট ', icon: '💎' },
  { id: 'material', title: 'সহজ স্টাডি ম্যাটেরিয়াল', icon: '🎬' },
  { id: 'value', title: 'স্বল্প খরচে অনেক কিছু', icon: '📦' },
  { id: 'presentation', title: 'সাবলীল উপস্থাপনা', icon: '📚' },
] as TrustFeature[];

export function useTrustFeatures() {
  const [features, setFeatures] = useState<TrustFeature[]>([]);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await getTrustFeatures(false);
        if (response.success && response.data) setFeatures(response.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadFeatures();
  }, []);

  const visibleFeatures = useMemo(() => {
    if (features.length > 0) return features.slice(0, 4);
    return FALLBACK_FEATURES;
  }, [features]);

  return { visibleFeatures };
}
