'use client';

import React, { useEffect, useState } from 'react';
import {
  Save, RotateCcw, Settings2, Layout, Link2, Facebook,
  Instagram, Twitter, Linkedin, Youtube, BookOpen, Users, CreditCard,
  Briefcase, Handshake, ShieldCheck, FileText, Globe, Phone, Mail,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getSiteSettings, upsertSiteSettings } from '@/lib/api/site-content';
import { cn } from '@/lib/utils';

// ─── Default values ────────────────────────────────────────────────────────

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
  'footer.youtube': '#',
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
  'footer.youtube': 'YouTube Channel URL',
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

// ─── Multiline keys ────────────────────────────────────────────────────────

const MULTILINE = new Set([
  'courses.subtitle',
  'payment.subtitle',
  'partners.subtitle',
  'trust.subtitle',
  'programs_cta.title',
  'footer.description',
  'footer.newsletter_subtitle',
]);

// ─── Tab structure ─────────────────────────────────────────────────────────

interface SectionGroup {
  label: string;
  icon: React.ReactNode;
  accent: string;
  keys: string[];
}

const LANDING_SECTIONS: SectionGroup[] = [
  {
    label: 'Courses Section',
    icon: <BookOpen className="h-4 w-4" />,
    accent: 'border-indigo-400 bg-indigo-50 text-indigo-600',
    keys: ['courses.badge', 'courses.title', 'courses.titleHighlight', 'courses.subtitle', 'courses.button'],
  },
  {
    label: 'Teachers Section',
    icon: <Users className="h-4 w-4" />,
    accent: 'border-violet-400 bg-violet-50 text-violet-600',
    keys: ['teachers.badge', 'teachers.title'],
  },
  {
    label: 'Digital Library Section',
    icon: <FileText className="h-4 w-4" />,
    accent: 'border-emerald-400 bg-emerald-50 text-emerald-600',
    keys: ['library.badge', 'library.title', 'library.titleHighlight', 'library.button'],
  },
  {
    label: 'Payment Section',
    icon: <CreditCard className="h-4 w-4" />,
    accent: 'border-sky-400 bg-sky-50 text-sky-600',
    keys: ['payment.badge', 'payment.title', 'payment.subtitle', 'payment.footer'],
  },
  {
    label: 'Programs CTA Section',
    icon: <Briefcase className="h-4 w-4" />,
    accent: 'border-orange-400 bg-orange-50 text-orange-600',
    keys: ['programs_cta.label', 'programs_cta.title', 'programs_cta.button'],
  },
  {
    label: 'Partners Section',
    icon: <Handshake className="h-4 w-4" />,
    accent: 'border-pink-400 bg-pink-50 text-pink-600',
    keys: ['partners.badge', 'partners.title', 'partners.subtitle'],
  },
  {
    label: 'Trust & Credibility Section',
    icon: <ShieldCheck className="h-4 w-4" />,
    accent: 'border-blue-400 bg-blue-50 text-blue-600',
    keys: ['trust.title', 'trust.subtitle'],
  },
];

const FOOTER_SECTIONS: SectionGroup[] = [
  {
    label: 'General Info',
    icon: <Globe className="h-4 w-4" />,
    accent: 'border-slate-400 bg-slate-50 text-slate-600',
    keys: ['footer.description', 'footer.copyright', 'footer.payment_logo_url'],
  },
  {
    label: 'Contact Details',
    icon: <Phone className="h-4 w-4" />,
    accent: 'border-teal-400 bg-teal-50 text-teal-600',
    keys: ['footer.phone', 'footer.phone_href', 'footer.email'],
  },
  {
    label: 'Social Media Links',
    icon: <Link2 className="h-4 w-4" />,
    accent: 'border-rose-400 bg-rose-50 text-rose-600',
    keys: ['footer.facebook', 'footer.instagram', 'footer.twitter', 'footer.linkedin', 'footer.youtube'],
  },
  {
    label: 'Newsletter',
    icon: <Mail className="h-4 w-4" />,
    accent: 'border-amber-400 bg-amber-50 text-amber-600',
    keys: ['footer.newsletter_title', 'footer.newsletter_subtitle'],
  },
  {
    label: 'Popular Courses (6 slots)',
    icon: <BookOpen className="h-4 w-4" />,
    accent: 'border-emerald-500 bg-emerald-50 text-emerald-700',
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
    label: 'Quick Links (6 slots)',
    icon: <Link2 className="h-4 w-4" />,
    accent: 'border-violet-500 bg-violet-50 text-violet-700',
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

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  'footer.facebook': <Facebook className="h-4 w-4 text-blue-600" />,
  'footer.instagram': <Instagram className="h-4 w-4 text-pink-500" />,
  'footer.twitter': <Twitter className="h-4 w-4 text-sky-500" />,
  'footer.linkedin': <Linkedin className="h-4 w-4 text-blue-700" />,
  'footer.youtube': <Youtube className="h-4 w-4 text-red-600" />,
};

// ─── Sub-components ────────────────────────────────────────────────────────

function FieldRow({
  fieldKey,
  value,
  onChange,
  onReset,
}: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const isMulti = MULTILINE.has(fieldKey);
  const icon = SOCIAL_ICONS[fieldKey];
  return (
    <div className={isMulti ? 'sm:col-span-2' : ''}>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor={fieldKey} className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          {icon}
          {LABELS[fieldKey] ?? fieldKey}
        </Label>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-600 transition-colors"
          title="Reset to default"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
      {isMulti ? (
        <Textarea
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="text-sm resize-y border-slate-200 focus-visible:ring-violet-400"
          placeholder={DEFAULTS[fieldKey]}
        />
      ) : (
        <Input
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm border-slate-200 focus-visible:ring-violet-400"
          placeholder={DEFAULTS[fieldKey]}
        />
      )}
    </div>
  );
}

function SectionCard({
  section,
  values,
  onChange,
  onReset,
}: {
  section: SectionGroup;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onReset: (key: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const accentBorder = section.accent.split(' ')[0];
  const accentBg = section.accent.split(' ')[1];
  const accentText = section.accent.split(' ')[2];

  return (
    <div className={cn('rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden border-l-4', accentBorder)}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50/70 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', accentBg, accentText)}>
            {section.icon}
          </div>
          <h2 className="font-black text-slate-800 text-sm">{section.label}</h2>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
            {section.keys.length} field{section.keys.length !== 1 ? 's' : ''}
          </span>
        </div>
        {collapsed
          ? <ChevronDown className="h-4 w-4 text-slate-400" />
          : <ChevronUp className="h-4 w-4 text-slate-400" />}
      </button>
      {!collapsed && (
        <div className="p-6 grid gap-5 sm:grid-cols-2">
          {section.keys.map((key) => (
            <FieldRow
              key={key}
              fieldKey={key}
              value={values[key] ?? ''}
              onChange={(v) => onChange(key, v)}
              onReset={() => onReset(key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

type TabId = 'landing' | 'footer';

const TABS: { id: TabId; label: string; icon: React.ReactNode; sections: SectionGroup[] }[] = [
  { id: 'landing', label: 'Landing Page', icon: <Layout className="h-4 w-4" />, sections: LANDING_SECTIONS },
  { id: 'footer', label: 'Footer', icon: <Globe className="h-4 w-4" />, sections: FOOTER_SECTIONS },
];

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('landing');

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
        toast({ title: 'Saved successfully', description: 'All site settings have been updated.' });
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
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-12 rounded-2xl bg-slate-100 animate-pulse w-72" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const totalFields = currentTab.sections.reduce((s, g) => s + g.keys.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Site Settings</h1>
              <p className="text-xs text-slate-500 mt-0.5">{totalFields} fields in this section</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 gap-2 rounded-xl"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save All'}
          </Button>
        </div>

        {/* Tab Bar */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all',
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-black transition-colors',
                activeTab === tab.id ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500',
              )}>
                {tab.sections.reduce((s, g) => s + g.keys.length, 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {currentTab.sections.map((section) => (
          <SectionCard
            key={section.label}
            section={section}
            values={values}
            onChange={handleChange}
            onReset={handleReset}
          />
        ))}

        <div className="flex justify-end pt-4 pb-12">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-10 gap-2 rounded-xl h-12"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
