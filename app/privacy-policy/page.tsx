'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getPublicPrivacyPolicy, type PrivacyPolicyPublic } from '@/lib/api/privacy-policy';
import { getSiteSettings } from '@/lib/api/site-content';
import { sanitizePrivacyDisplayHtml } from '@/lib/sanitize-privacy-display';
import { Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState<PrivacyPolicyPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [safeHtml, setSafeHtml] = useState('');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(false);
      try {
        const [policyRes, settingsRes] = await Promise.all([
          getPublicPrivacyPolicy(),
          getSiteSettings(),
        ]);
        if (cancelled) return;
        if (policyRes.success) {
          setPolicy(policyRes.data);
          if (policyRes.data?.content) {
            setSafeHtml(sanitizePrivacyDisplayHtml(policyRes.data.content));
          } else {
            setSafeHtml('');
          }
        } else {
          setPolicy(null);
          setSafeHtml('');
        }
        if (settingsRes.success && settingsRes.data) {
          const map: Record<string, string> = {};
          for (const s of settingsRes.data) map[s.key] = s.value;
          setSiteSettings(map);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setPolicy(null);
          setSafeHtml('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroTitle = policy?.title?.trim() || 'প্রাইভেসি পলিসি';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <div className="relative bg-[#0F172A] pt-32 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-6">
            <Lock size={14} /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{heroTitle}</h1>
          <p className="text-slate-400 mt-4 text-lg font-medium">আপনার তথ্য আমরা কীভাবে ব্যবহার করি</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-6 rounded-lg bg-slate-200 animate-pulse"
                style={{ width: `${70 + i * 7}%` }}
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-bold text-lg">Unable to load privacy policy</p>
            <p className="text-slate-500 text-sm mt-2">Please try again later.</p>
          </div>
        ) : policy && safeHtml.trim() ? (
          <div
            className="prose prose-slate prose-lg max-w-none bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm
              [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-800 [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-slate-600
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:text-slate-600
              [&_li]:leading-relaxed [&_a]:text-indigo-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
            <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-bold text-lg">Privacy Policy Not Available</p>
            <p className="text-slate-600 font-medium text-sm mt-2">No Privacy Policy Content Found</p>
            <p className="text-slate-500 text-sm mt-2">
              প্রাইভেসি পলিসি এখনও প্রকাশ করা হয়নি। পরে আবার দেখুন।
            </p>
          </div>
        )}
      </div>

      <div className="mt-16">
        <Footer siteSettings={siteSettings} />
      </div>
    </div>
  );
}
