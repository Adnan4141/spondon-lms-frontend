'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Save, RotateCcw, Image as ImageIcon, Plus, Trash2, Upload, Link2,
  Star, BookOpen, Target, Users, Eye, EyeOff, ExternalLink,
} from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getSiteSettings, upsertSiteSettings, uploadSiteContentImage } from '@/lib/api/site-content';
import { API_ORIGIN } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULTS: Record<string, string> = {
  'about.hero_badge': 'আমাদের লক্ষ্য',
  'about.hero_title': 'চিন্তার স্পন্দনে,',
  'about.hero_title_highlight': 'স্বপ্নের সন্ধানে',
  'about.hero_description': 'স্পন্দন, শিক্ষার্থীদের চিন্তার জগৎকে আরও সুন্দর, সুদূরপ্রসারী ও বাস্তবে রূপ দিতে সর্বদা প্রতিজ্ঞাবদ্ধ।',
  'about.hero_video_url': '',
  'about.story_title': 'আমাদের গল্প',
  'about.story_body': '<p>স্পন্দনের প্রতিটি কার্যক্রম শিক্ষার্থীদের চিন্তার জগৎকে আরও সুন্দর করতে ব্যস্ত।</p>',
  'about.story_image_url': '',
  'about.story_philosophy': 'Caring the potentiality',
  'about.values_title': 'আমাদের মূল ভিত্তি',
  'about.values_items': '[]',
  'about.mission_quote': 'স্পন্দনের নামের সাথেই জড়িয়ে আছে প্রতিটি শিক্ষার্থীর জন্য Caring the potentiality',
  'about.mission_cta_text': 'আমাদের সাথে যুক্ত হোন',
  'about.mission_cta_href': '/login',
};

const LABELS: Record<string, string> = {
  'about.hero_badge': 'Hero Badge Text',
  'about.hero_title': 'Hero Title',
  'about.hero_title_highlight': 'Hero Title Highlight',
  'about.hero_description': 'Hero Description',
  'about.hero_video_url': 'Hero Image / Video Thumbnail URL',
  'about.story_title': 'Story Section Title',
  'about.story_body': 'Story Body (HTML)',
  'about.story_image_url': 'Story Section Image URL',
  'about.story_philosophy': 'Philosophy Quote (small badge)',
  'about.values_title': 'Core Values Section Title',
  'about.values_items': 'Core Values (JSON)',
  'about.mission_quote': 'Mission Quote',
  'about.mission_cta_text': 'CTA Button Text',
  'about.mission_cta_href': 'CTA Button URL',
};

interface CoreValue {
  title: string;
  imageUrl: string;
  color: string;
}

const COLOR_OPTIONS = [
  'bg-rose-50', 'bg-orange-50', 'bg-blue-50', 'bg-emerald-50',
  'bg-indigo-50', 'bg-pink-50', 'bg-amber-50', 'bg-cyan-50', 'bg-violet-50',
];

type TabId = 'hero' | 'story' | 'values' | 'mission';
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'hero', label: 'Hero', icon: <Star className="w-4 h-4" /> },
  { id: 'story', label: 'Our Story', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'values', label: 'Core Values', icon: <Users className="w-4 h-4" /> },
  { id: 'mission', label: 'Mission', icon: <Target className="w-4 h-4" /> },
];

// ─── Story Body Editor (Tiptap) ───────────────────────────────────────────

function StoryBodyEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  async function handleImageUpload(file: File): Promise<string> {
    try {
      const res = await uploadSiteContentImage(file);
      return res.imageUrl.startsWith('/') ? `${API_ORIGIN}${res.imageUrl}` : res.imageUrl;
    } catch {
      toast({ title: 'Image upload failed', variant: 'destructive' });
      throw new Error('Upload failed');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-700">Story Body</Label>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
        >
          {preview ? <><EyeOff className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
        </button>
      </div>
      {preview ? (
        <div
          className="prose prose-sm max-w-none min-h-[160px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <RichTextEditor
          value={value}
          onChange={onChange}
          onImageUpload={handleImageUpload}
          placeholder="Write the story body…"
        />
      )}
    </div>
  );
}

// ─── Image Field (URL or Upload) ───────────────────────────────────────────

function ImageField({
  fieldKey, label, value, onChange,
}: { fieldKey: string; label: string; value: string; onChange: (k: string, v: string) => void }) {
  const [useUpload, setUseUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadSiteContentImage(file);
      onChange(fieldKey, res.imageUrl);
      toast({ title: 'Image uploaded' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = value?.startsWith('/') ? `${API_ORIGIN}${value}` : value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <button
          type="button"
          onClick={() => setUseUpload(!useUpload)}
          className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
        >
          {useUpload ? <><Link2 className="w-3 h-3" /> Use URL</> : <><Upload className="w-3 h-3" /> Upload File</>}
        </button>
      </div>
      {useUpload ? (
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleFile} className="text-sm file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-semibold hover:file:bg-indigo-100" disabled={uploading} />
          {uploading && <span className="text-xs text-slate-500">Uploading…</span>}
        </div>
      ) : (
        <Input value={value ?? ''} onChange={(e) => onChange(fieldKey, e.target.value)} placeholder="https://..." className="text-sm" />
      )}
      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayUrl} alt="Preview" className="h-20 w-auto rounded-xl border border-slate-200 object-cover mt-1" />
      )}
    </div>
  );
}

// ─── Core Values Editor ────────────────────────────────────────────────────

function CoreValuesEditor({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [items, setItems] = useState<CoreValue[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try { setItems(JSON.parse(value || '[]')); } catch { setItems([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: CoreValue[]) {
    setItems(next);
    onChange(JSON.stringify(next));
  }

  function add() {
    update([...items, { title: 'NEW VALUE', imageUrl: '', color: 'bg-slate-50' }]);
  }

  function remove(i: number) {
    update(items.filter((_, idx) => idx !== i));
  }

  function setField(i: number, field: keyof CoreValue, v: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: v } : item);
    update(next);
  }

  async function handleFileUpload(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(i);
    try {
      const res = await uploadSiteContentImage(file);
      setField(i, 'imageUrl', res.imageUrl);
      toast({ title: 'Image uploaded' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-700">Core Values ({items.length})</Label>
        <Button size="sm" variant="outline" onClick={add} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Value
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Value #{i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Title</Label>
              <Input value={item.title} onChange={(e) => setField(i, 'title', e.target.value)} placeholder="e.g. LEARNER FIRST" className="text-sm bg-white" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Image</Label>
              <div className="space-y-2">
                <Input value={item.imageUrl} onChange={(e) => setField(i, 'imageUrl', e.target.value)} placeholder="https://..." className="text-sm bg-white" />
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(i, e)} disabled={uploadingIdx === i} className="text-xs file:mr-2 file:px-2 file:py-0.5 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-semibold" />
                  {uploadingIdx === i && <span className="text-xs text-slate-500">Uploading…</span>}
                </div>
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl.startsWith('/') ? `${API_ORIGIN}${item.imageUrl}` : item.imageUrl} alt="preview" className="h-16 w-auto rounded-lg border border-slate-200 object-cover" />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Background Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setField(i, 'color', color)}
                    className={cn('w-7 h-7 rounded-lg border-2 transition-all', color, item.color === color ? 'border-indigo-600 scale-110' : 'border-transparent hover:border-slate-300')}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            No core values yet. Click &quot;Add Value&quot; to start.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminAboutUsPage() {
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [activeTab, setActiveTab] = useState<TabId>('hero');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getSiteSettings('about').then((res) => {
      if (res.success && res.data) {
        const map: Record<string, string> = {};
        for (const item of res.data) map[item.key] = item.value;
        setValues((prev) => ({ ...prev, ...map }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await upsertSiteSettings(values, LABELS);
      if (res.success) {
        toast({ title: 'Saved successfully!' });
      } else {
        toast({ title: 'Save failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setValues(DEFAULTS);
    toast({ title: 'Reset to defaults' });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">About Us CMS</h1>
              <p className="text-xs text-slate-500">Manage the public About Us page content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open('/about-us', '_blank')} className="gap-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5" /> View Page
            </Button>
            <Button variant="outline" size="sm" onClick={reset} disabled={saving} className="gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 pb-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {activeTab === 'hero' && (
              <>
                <SectionTitle>Hero Section</SectionTitle>
                <FieldRow label="Badge" fieldKey="about.hero_badge" value={values} set={set} />
                <FieldRow label="Title (main)" fieldKey="about.hero_title" value={values} set={set} />
                <FieldRow label="Title (highlight/gradient)" fieldKey="about.hero_title_highlight" value={values} set={set} />
                <FieldRow label="Description" fieldKey="about.hero_description" value={values} set={set} multiline />
                <ImageField fieldKey="about.hero_video_url" label="Hero Image / Video Thumbnail" value={values['about.hero_video_url']} onChange={set} />
              </>
            )}
            {activeTab === 'story' && (
              <>
                <SectionTitle>Our Story Section</SectionTitle>
                <FieldRow label="Section Title" fieldKey="about.story_title" value={values} set={set} />
                <StoryBodyEditor value={values['about.story_body']} onChange={(html) => set('about.story_body', html)} />
                <ImageField fieldKey="about.story_image_url" label="Story Section Image" value={values['about.story_image_url']} onChange={set} />
                <FieldRow label="Philosophy Badge Text" fieldKey="about.story_philosophy" value={values} set={set} />
              </>
            )}
            {activeTab === 'values' && (
              <>
                <SectionTitle>Core Values Section</SectionTitle>
                <FieldRow label="Section Title" fieldKey="about.values_title" value={values} set={set} />
                <CoreValuesEditor value={values['about.values_items']} onChange={(v) => set('about.values_items', v)} />
              </>
            )}
            {activeTab === 'mission' && (
              <>
                <SectionTitle>Mission / CTA Section</SectionTitle>
                <FieldRow label="Mission Quote" fieldKey="about.mission_quote" value={values} set={set} multiline />
                <FieldRow label="CTA Button Text" fieldKey="about.mission_cta_text" value={values} set={set} />
                <FieldRow label="CTA Button URL" fieldKey="about.mission_cta_href" value={values} set={set} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-3 mb-2">
      <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">{children}</h2>
    </div>
  );
}

function FieldRow({
  label, fieldKey, value, set, multiline = false, rows = 3,
}: {
  label: string;
  fieldKey: string;
  value: Record<string, string>;
  set: (k: string, v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {multiline ? (
        <Textarea
          value={value[fieldKey] ?? ''}
          onChange={(e) => set(fieldKey, e.target.value)}
          rows={rows}
          className="text-sm resize-y"
        />
      ) : (
        <Input
          value={value[fieldKey] ?? ''}
          onChange={(e) => set(fieldKey, e.target.value)}
          className="text-sm"
        />
      )}
    </div>
  );
}
