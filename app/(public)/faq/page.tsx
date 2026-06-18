import { getPublicFaqs } from '@/lib/api/faq';
import FaqPageClient from './FaqPageClient';

export default async function FaqPage() {
  let items: Awaited<ReturnType<typeof getPublicFaqs>>['data'] = [];
  let loadError = false;

  try {
    const faqRes = await getPublicFaqs();
    if (faqRes.success && faqRes.data) {
      items = faqRes.data;
    }
  } catch {
    loadError = true;
    items = [];
  }

  return <FaqPageClient items={items} loadError={loadError} />;
}
