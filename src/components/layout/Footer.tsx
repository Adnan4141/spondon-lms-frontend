'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Facebook, Instagram, MessageCircle, Youtube, Phone, Mail, Send } from 'lucide-react';
import { useFooterSettings } from './FooterSettingsContext';

interface FooterProps {
  siteSettings?: Record<string, string>;
}

const DEFAULT_SETTINGS: Record<string, string> = {
  'footer.brand_name': 'Mathlab',
  'footer.description': 'আমরা বিশ্বাস করি মানসম্মত শিক্ষা সবার অধিকার। প্রযুক্তির মাধ্যমে শিক্ষাকে সহজলভ্য করাই আমাদের মূল লক্ষ্য।',
  'footer.phone': '+৮৮০ ১৭০০-০০০০০০',
  'footer.phone_href': 'tel:+8801700000000',
  'footer.email': 'support@mathlab.com',
  'footer.facebook': '#',
  'footer.instagram': '#',
  'footer.whatsapp': '#',
  'footer.youtube': '#',
  'footer.newsletter_title': 'নতুন কোর্সের আপডেট পেতে চান?',
  'footer.newsletter_subtitle': 'আমাদের নিউজলেটারে সাবস্ক্রাইব করে যুক্ত থাকুন।',
  'footer.newsletter_placeholder': 'আপনার ইমেইল...',
  'footer.courses_heading': 'জনপ্রিয় কোর্স',
  'footer.links_heading': 'লিঙ্কসমূহ',
  'footer.contact_heading': 'সরাসরি যোগাযোগ',
  'footer.copyright': '© ২০২৬ ম্যাথল্যাব',
  'footer.payment_logo_url': '/images/collaborator/bikash-logo.png',
  'footer.course_1_label': 'একাডেমিক প্রোগ্রাম',
  'footer.course_1_href': '/courses',
  'footer.course_2_label': 'মেডিকেল প্রস্তুতি',
  'footer.course_2_href': '/courses',
  'footer.course_3_label': 'ইঞ্জিনিয়ারিং',
  'footer.course_3_href': '/courses',
  'footer.course_4_label': 'ভার্সিটি ক ইউনিট',
  'footer.course_4_href': '/courses',
  'footer.course_5_label': '',
  'footer.course_5_href': '/courses',
  'footer.course_6_label': '',
  'footer.course_6_href': '/courses',
  'footer.link_1_label': 'আমাদের সম্পর্কে',
  'footer.link_1_href': '/about-us',
  'footer.link_2_label': 'ক্যারিয়ার',
  'footer.link_2_href': '#',
  'footer.link_3_label': 'প্রাইভেসি পলিসি',
  'footer.link_3_href': '/privacy-policy',
  'footer.link_4_label': 'সচরাচর জিজ্ঞাসা',
  'footer.link_4_href': '/faq',
  'footer.link_5_label': '',
  'footer.link_5_href': '#',
  'footer.link_6_label': '',
  'footer.link_6_href': '#',
};

const SOCIAL_LINKS = [
  { Icon: Facebook, settingKey: 'footer.facebook', label: 'Facebook' },
  { Icon: Instagram, settingKey: 'footer.instagram', label: 'Instagram' },
  { Icon: MessageCircle, settingKey: 'footer.whatsapp', label: 'WhatsApp' },
  { Icon: Youtube, settingKey: 'footer.youtube', label: 'YouTube' },
];

const CONTACT_FALLBACK_KEYS = ['footer.email', 'footer.phone', 'footer.phone_href'] as const;

export function Footer({ siteSettings = {} }: FooterProps) {
  const contextualSettings = useFooterSettings();
  const merged = { ...DEFAULT_SETTINGS, ...contextualSettings, ...siteSettings };
  const s = { ...merged };
  for (const key of CONTACT_FALLBACK_KEYS) {
    if (!String(s[key] ?? '').trim()) {
      s[key] = DEFAULT_SETTINGS[key];
    }
  }

  const courseLinks = Array.from({ length: 6 }, (_, i) => ({
    label: s[`footer.course_${i + 1}_label`] ?? '',
    href: s[`footer.course_${i + 1}_href`] ?? '/courses',
  })).filter((c) => c.label.trim() !== '');

  const quickLinks = Array.from({ length: 6 }, (_, i) => ({
    label: s[`footer.link_${i + 1}_label`] ?? '',
    href: s[`footer.link_${i + 1}_href`] ?? '#',
  })).filter((l) => l.label.trim() !== '');

  return (
    <footer className="relative">
      {/* Floating Subscription Card */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-20">
        <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {s['footer.newsletter_title']}
            </h3>
            <p className="text-slate-500 font-medium mt-2 text-sm sm:text-base">
              {s['footer.newsletter_subtitle']}
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex items-center bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all">
            <input
              type="email"
              placeholder={s['footer.newsletter_placeholder']}
              className="bg-transparent border-none focus:ring-0 px-4 py-2 w-full md:w-64 text-slate-900 font-bold outline-none"
            />
            <button className="bg-[#10B981] hover:bg-slate-900 text-white p-3 rounded-xl transition-all flex items-center justify-center group/btn">
              <Send className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="bg-[#0F172A] text-white pt-48 pb-12 rounded-t-[60px] lg:mx-4 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">

            {/* Column 1: Branding */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/logo/mathlab.png"
                  alt="Mathlab Logo"
                  width={443}
                  height={512}
                  className="object-contain h-11 w-auto"
                />
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  {s['footer.brand_name']}
                </span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm text-sm sm:text-base">
                {s['footer.description']}
              </p>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ Icon, settingKey, label }) => (
                  <motion.a
                    key={settingKey}
                    href={s[settingKey] || '#'}
                    target={s[settingKey] && s[settingKey] !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ y: -5 }}
                    className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 transition-all group"
                  >
                    <Icon className="h-5 w-5 text-slate-400 group-hover:text-white" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Column 2 & 3: Links */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-8">
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-500">{s['footer.courses_heading']}</h4>
                <ul className="space-y-3 sm:space-y-4 font-bold text-slate-300 text-sm sm:text-base">
                  {courseLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-emerald-400 flex items-center gap-2 transition-all group">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-400 group-hover:scale-125 transition-all" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-500">{s['footer.links_heading']}</h4>
                <ul className="space-y-3 sm:space-y-4 font-bold text-slate-300 text-sm sm:text-base">
                  {quickLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-emerald-400 flex items-center gap-2 transition-all group">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-all" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 4: Contact */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-500">{s['footer.contact_heading']}</h4>
              <div className="space-y-5">
                <a
                  href={s['footer.phone_href']}
                  className="flex items-center gap-4 group bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-slate-200 text-sm sm:text-base">{s['footer.phone']}</span>
                </a>
                <a
                  href={`mailto:${s['footer.email']}`}
                  className="flex items-center gap-4 group bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-slate-200 text-sm sm:text-base break-all">{s['footer.email']}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500">
            <p className="text-sm font-bold italic">{s['footer.copyright']}</p>
            <div className="flex items-center gap-6">
              {s['footer.payment_logo_url'] && (
                <img
                  src={s['footer.payment_logo_url']}
                  alt="Payment"
                  className="h-7 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
