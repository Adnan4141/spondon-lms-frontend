'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getSiteSettings } from '@/lib/api/site-content';
import { Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        getSiteSettings().then((res) => {
            if (res.success && res.data) {
                const map: Record<string, string> = {};
                for (const s of res.data) map[s.key] = s.value;
                setContent(map['pages.privacy_policy'] ?? '');
                setSiteSettings(map);
            }
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header />

            {/* Hero */}
            <div className="relative bg-[#0F172A] pt-32 pb-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-6">
                        <Lock size={14} /> Legal
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">প্রাইভেসি পলিসি</h1>
                    <p className="text-slate-400 mt-4 text-lg font-medium">আপনার তথ্য আমরা কীভাবে ব্যবহার করি</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-6 rounded-lg bg-slate-200 animate-pulse" style={{ width: `${70 + i * 7}%` }} />
                        ))}
                    </div>
                ) : content.trim() ? (
                    <div
                        className="prose prose-slate prose-lg max-w-none bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm
                            [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-4
                            [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-800 [&_h3]:mt-6 [&_h3]:mb-3
                            [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:mb-4
                            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-slate-600
                            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:text-slate-600
                            [&_li]:leading-relaxed [&_a]:text-indigo-600 [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                ) : (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
                        <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-lg">প্রাইভেসি পলিসি এখনও যোগ করা হয়নি।</p>
                        <p className="text-slate-400 text-sm mt-2">অ্যাডমিন প্যানেল থেকে Site Settings &gt; Pages থেকে যোগ করুন।</p>
                    </div>
                )}
            </div>

            <div className="mt-16">
                <Footer siteSettings={siteSettings} />
            </div>
        </div>
    );
}
