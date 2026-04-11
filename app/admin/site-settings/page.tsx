'use client';

import React, { useEffect, useState } from 'react';
import { Save, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getSiteSettings, upsertSiteSettings } from '@/lib/api/site-content';

// ─── Default values (mirrors component defaults) ──────────────────────────

const DEFAULTS: Record<string, string> = {
  'courses.badge': 'Premium Learning',
  'courses.title': 'আমাদের সবচেয়ে ',
  'courses.titleHighlight': 'জনপ্রিয় কোর্সসমূহ',
  'courses.subtitle': 'নিজেদের প্রস্তুত করুন আগামী দিনের চ্যালেঞ্জ মোকাবিলায়।',
  'courses.button': 'সকল কোর্স দেখুন',

  'teachers.badge': 'OUR TEACHERS',
  'teachers.title': 'আমাদের শিক্ষকমণ্ডলী',

  'library.badge': 'Learning Resource',
  'library.title': 'স্মার্ট বইয়ের',
  'library.titleHighlight': 'কালেকশন',
  'library.button': 'সকল বই দেখুন',

  'payment.badge': 'Secure Checkout',
  'payment.title': 'পেমেন্ট পার্টনার',
  'payment.subtitle': 'Trusted payment gateways ensuring safe and secure transactions',
  'payment.footer': 'Verified by SSLCOMMERZ',

  'programs_cta.label': 'আমাদের প্রোগ্রামসমূহ',
  'programs_cta.title': 'সেরা প্রোগ্রামের, সেরা কোর্সে যুক্ত হন আজই',
  'programs_cta.button': 'সবকটি কোর্স দেখুন',

  'partners.badge': 'TRUSTED BY',
  'partners.title': 'আমাদের পার্টনারসমূহ',
  'partners.subtitle': 'যেসব প্রতিষ্ঠান ও ব্র্যান্ডের সাথে আমরা কাজ করি — তালিকা অ্যাডমিন প্যানেল থেকে আপডেট করা যায়।',

  'trust.title': 'কেন Shikho-তে আস্থা রাখবে?',
  'trust.subtitle': 'সেরা মেন্টর ও সর্বাধুনিক প্রযুক্তির সাথে সারাদেশের ৩০ লক্ষ+ শিক্ষার্থীর মানসম্মত পড়ালেখা ও পরীক্ষা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান Shikho!',

  // Footer
  'footer.description': 'আমরা বিশ্বাস করি মানসম্মত শিক্ষা সবার অধিকার। প্রযুক্তির মাধ্যমে শিক্ষাকে সহজলভ্য করাই আমাদের মূল লক্ষ্য।',
  'footer.phone': '+৮৮০ ১৭০০-০০০০০০',
  'footer.phone_href': 'tel:+8801700000000',
  'footer.email': 'support@spondonpro.com',
  'footer.facebook': '#',
  'footer.instagram': '#',
  'footer.twitter': '#',
  'footer.linkedin': '#',
  'footer.newsletter_title': 'নতুন কোর্সের আপডেট পেতে চান?',
  'footer.newsletter_subtitle': 'আমাদের নিউজলেটারে সাবস্ক্রাইব করে যুক্ত থাকুন।',
  'footer.copyright': '© ২০২৬ স্পন্দন',
  'footer.payment_logo_url': '/images/SSL-Commerz-Pay-With-logo-All-Size-01-570x213.png',
  // Courses slots
  'footer.course_1_label': 'একাডেমিক প্রোগ্রাম', 'footer.course_1_href': '/courses',
  'footer.course_2_label': 'মেডিকেল প্রস্তুতি',   'footer.course_2_href': '/courses',
  'footer.course_3_label': 'ইঞ্জিনিয়ারিং',        'footer.course_3_href': '/courses',
  'footer.course_4_label': 'ভার্সিটি ক ইউনিট',    'footer.course_4_href': '/courses',
  'footer.course_5_label': '',                      'footer.course_5_href': '/courses',
  'footer.course_6_label': '',                      'footer.course_6_href': '/courses',
  // Link slots
  'footer.link_1_label': 'আমাদের সম্পর্কে', 'footer.link_1_href': '/about-us',
  'footer.link_2_label': 'ক্যারিয়ার',        'footer.link_2_href': '#',
  'footer.link_3_label': 'প্রাইভেসি পলিসি',  'footer.link_3_href': '#',
  'footer.link_4_label': 'সচরাচর জিজ্ঞাসা',  'footer.link_4_href': '#',
  'footer.link_5_label': '',                  'footer.link_5_href': '#',
  'footer.link_6_label': '',                  'footer.link_6_href': '#',
};

const LABELS: Record<string, string> = {
  'courses.badge': 'Badge',
  'courses.title': 'Title (main part)',
  'courses.titleHighlight': 'Title (gradient/highlight part)',
  'courses.subtitle': 'Subtitle',
  'courses.button': 'Button Text',

  'teachers.badge': 'Badge',
  'teachers.title': 'Section Title',

  'library.badge': 'Badge',
  'library.title': 'Title (main part)',
  'library.titleHighlight': 'Title (highlight part)',
  'library.button': 'Button Text',

  'payment.badge': 'Badge',
  'payment.title': 'Section Title',
  'payment.subtitle': 'Subtitle',
  'payment.footer': 'Footer Text',

  'programs_cta.label': 'Label',
  'programs_cta.title': 'Section Title',
  'programs_cta.button': 'Button Text',

  'partners.badge': 'Badge',
  'partners.title': 'Section Title',
  'partners.subtitle': 'Subtitle',

  'trust.title': 'Section Title',
  'trust.subtitle': 'Subtitle Paragraph',

  // Footer – General
  'footer.description': 'Company Description',
  'footer.phone': 'Phone Display Text',
  'footer.phone_href': 'Phone Link (tel:+880...)',
  'footer.email': 'Email Address',
  'footer.facebook': 'Facebook URL',
  'footer.instagram': 'Instagram URL',
  'footer.twitter': 'Twitter/X URL',
  'footer.linkedin': 'LinkedIn URL',
  'footer.newsletter_title': 'Newsletter Card Title',
  'footer.newsletter_subtitle': 'Newsletter Card Subtitle',
  'footer.copyright': 'Copyright Text',
  'footer.payment_logo_url': 'Payment Logo Image URL',
  // Courses slots
  'footer.course_1_label': 'Course 1 Label', 'footer.course_1_href': 'Course 1 Link',
  'footer.course_2_label': 'Course 2 Label', 'footer.course_2_href': 'Course 2 Link',
  'footer.course_3_label': 'Course 3 Label', 'footer.course_3_href': 'Course 3 Link',
  'footer.course_4_label': 'Course 4 Label', 'footer.course_4_href': 'Course 4 Link',
  'footer.course_5_label': 'Course 5 Label', 'footer.course_5_href': 'Course 5 Link',
  'footer.course_6_label': 'Course 6 Label', 'footer.course_6_href': 'Course 6 Link',
  // Link slots
  'footer.link_1_label': 'Link 1 Label', 'footer.link_1_href': 'Link 1 URL',
  'footer.link_2_label': 'Link 2 Label', 'footer.link_2_href': 'Link 2 URL',
  'footer.link_3_label': 'Link 3 Label', 'footer.link_3_href': 'Link 3 URL',
  'footer.link_4_label': 'Link 4 Label', 'footer.link_4_href': 'Link 4 URL',
  'footer.link_5_label': 'Link 5 Label', 'footer.link_5_href': 'Link 5 URL',
  'footer.link_6_label': 'Link 6 Label', 'footer.link_6_href': 'Link 6 URL',
};

// ─── Grouped sections ──────────────────────────────────────────────────────

const GROUPS: { label: string; color: string; keys: string[] }[] = [
  { label: 'Courses Section', color: 'border-indigo-400', keys: ['courses.badge', 'courses.title', 'courses.titleHighlight', 'courses.subtitle', 'courses.button'] },
  { label: 'Teachers Section', color: 'border-violet-400', keys: ['teachers.badge', 'teachers.title'] },
  { label: 'Digital Library Section', color: 'border-emerald-400', keys: ['library.badge', 'library.title', 'library.titleHighlight', 'library.button'] },
  { label: 'Payment Section', color: 'border-sky-400', keys: ['payment.badge', 'payment.title', 'payment.subtitle', 'payment.footer'] },
  { label: 'Programs CTA Section', color: 'border-orange-400', keys: ['programs_cta.label', 'programs_cta.title', 'programs_cta.button'] },
  { label: 'Partners Section', color: 'border-pink-400', keys: ['partners.badge', 'partners.title', 'partners.subtitle'] },
  { label: 'Trust Section', color: 'border-blue-400', keys: ['trust.title', 'trust.subtitle'] },
  {
    label: 'Footer – General',
    color: 'border-slate-500',
    keys: [
      'footer.newsletter_title', 'footer.newsletter_subtitle',
      'footer.description',
      'footer.phone', 'footer.phone_href',
      'footer.email',
      'footer.facebook', 'footer.instagram', 'footer.twitter', 'footer.linkedin',
      'footer.copyright', 'footer.payment_logo_url',
    ],
  },
  {
    label: 'Footer – Popular Courses (6 slots)',
    color: 'border-emerald-600',
    keys: [
      'footer.course_1_label', 'footer.course_1_href',
      'footer.course_2_label', 'footer.course_2_href',
      'footer.course_3_label', 'footer.course_3_href',
      'footer.course_4_label', 'footer.course_4_href',
      'footer.course_5_label', 'footer.course_5_href',
      'footer.course_6_label', 'footer.course_6_href',
    ],
  },
  {
    label: 'Footer – Quick Links (6 slots)',
    color: 'border-violet-600',
    keys: [
      'footer.link_1_label', 'footer.link_1_href',
      'footer.link_2_label', 'footer.link_2_href',
      'footer.link_3_label', 'footer.link_3_href',
      'footer.link_4_label', 'footer.link_4_href',
      'footer.link_5_label', 'footer.link_5_href',
      'footer.link_6_label', 'footer.link_6_href',
    ],
  },
];

// ─── Multi-line keys ───────────────────────────────────────────────────────

const MULTILINE = new Set([
  'courses.subtitle',
  'payment.subtitle',
  'partners.subtitle',
  'trust.subtitle',
  'programs_cta.title',
  'footer.description',
  'footer.newsletter_subtitle',
]);

// ─── Component ────────────────────────────────────────────────────────────

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSiteSettings();
        if (res.success && res.data && res.data.length > 0) {
          const merged = { ...DEFAULTS };
          for (const s of res.data) merged[s.key] = s.value;
          setValues(merged);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = (key: string) => {
    setValues((prev) => ({ ...prev, [key]: DEFAULTS[key] ?? '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await upsertSiteSettings(values, LABELS);
      if (res.success) {
        toast({ title: 'Saved', description: 'All section text settings have been updated.' });
      } else {
        toast({ title: 'Error', description: (res as any).message || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <Toaster />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Site Settings</h1>
            <p className="text-sm text-slate-500">Manage all landing page section text from here</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save All'}
        </Button>
      </div>

      {GROUPS.map((group) => (
        <div key={group.label} className={`rounded-2xl border-l-4 ${group.color} bg-white shadow-sm border border-slate-100 overflow-hidden`}>
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-slate-800 text-base">{group.label}</h2>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            {group.keys.map((key) => (
              <div key={key} className={MULTILINE.has(key) ? 'sm:col-span-2' : ''}>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor={key} className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {LABELS[key] ?? key}
                  </Label>
                  <button
                    type="button"
                    onClick={() => handleReset(key)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 transition-colors"
                    title="Reset to default"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
                {MULTILINE.has(key) ? (
                  <Textarea
                    id={key}
                    value={values[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    rows={3}
                    className="text-sm resize-y"
                    placeholder={DEFAULTS[key]}
                  />
                ) : (
                  <Input
                    id={key}
                    value={values[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="text-sm"
                    placeholder={DEFAULTS[key]}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end pb-10">
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
