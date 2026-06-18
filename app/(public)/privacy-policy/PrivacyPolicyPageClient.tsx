'use client';

import { useMemo } from 'react';
import type { PrivacyPolicyPublic } from '@/lib/api/privacy-policy';
import { sanitizePrivacyDisplayHtml } from '@/lib/sanitize-privacy-display';
import { Lock } from 'lucide-react';

type Props = {
  policy: PrivacyPolicyPublic | null;
  loadError: boolean;
};

export default function PrivacyPolicyPageClient({ policy, loadError }: Props) {
  const safeHtml = useMemo(
    () => (policy?.content ? sanitizePrivacyDisplayHtml(policy.content) : ''),
    [policy?.content],
  );

  const heroTitle = policy?.title?.trim() || 'প্রাইভেসি পলিসি';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden bg-[#0F172A] pb-16 pt-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Lock size={14} /> Legal
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">{heroTitle}</h1>
          <p className="mt-4 text-lg font-medium text-slate-400">আপনার তথ্য আমরা কীভাবে ব্যবহার করি</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-12">
        {loadError ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <Lock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">Unable to load privacy policy</p>
            <p className="mt-2 text-sm text-slate-500">Please try again later.</p>
          </div>
        ) : policy && safeHtml.trim() ? (
          <div
            className="prose prose-slate prose-lg max-w-none rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-12
              [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900
              [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-800
              [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-slate-600
              [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-slate-600
              [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol]:text-slate-600
              [&_li]:leading-relaxed [&_a]:text-indigo-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
            <Lock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">Privacy Policy Not Available</p>
            <p className="mt-2 text-sm font-medium text-slate-600">No Privacy Policy Content Found</p>
            <p className="mt-2 text-sm text-slate-500">
              প্রাইভেসি পলিসি এখনও প্রকাশ করা হয়নি। পরে আবার দেখুন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
