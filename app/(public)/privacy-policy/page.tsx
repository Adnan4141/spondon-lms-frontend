import { getPublicPrivacyPolicy } from '@/lib/api/privacy-policy';
import PrivacyPolicyPageClient from './PrivacyPolicyPageClient';

export default async function PrivacyPolicyPage() {
  let policy: Awaited<ReturnType<typeof getPublicPrivacyPolicy>>['data'] = null;
  let loadError = false;

  try {
    const policyRes = await getPublicPrivacyPolicy();
    if (policyRes.success) {
      policy = policyRes.data;
    }
  } catch {
    loadError = true;
    policy = null;
  }

  return <PrivacyPolicyPageClient policy={policy} loadError={loadError} />;
}
