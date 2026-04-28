import { PrivacyPolicyEditor } from '@/features/admin/privacy-policy/PrivacyPolicyEditor';

export default function AdminPrivacyPolicyPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit formatted content below. Only published policies appear on the public site.
        </p>
      </div>
      <PrivacyPolicyEditor />
    </div>
  );
}
