'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createPartner,
  updatePartner,
  type PartnerAdmin,
} from '@/lib/api/partners';
import { getCourses } from '@/lib/api/courses';
import { getBooks } from '@/lib/api/books';
import { Globe2, Upload, Sparkles, BookOpen, Library, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PARTNER_TYPES = [
  'MEDIA',
  'TELECOM',
  'PAYMENT',
  'EDUCATION',
  'HARDWARE',
  'OTHER',
] as const;

interface Option {
  id: string;
  label: string;
  sub?: string;
}

function SearchMultiSelect({
  options,
  selected,
  onToggle,
  placeholder,
  icon: Icon,
}: {
  options: Option[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  placeholder: string;
  icon: React.ElementType;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      !selected.has(o.id) &&
      (o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub?.toLowerCase().includes(query.toLowerCase()) ?? false)),
  );

  const selectedOptions = options.filter((o) => selected.has(o.id));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="space-y-2">
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
            >
              {o.label}
              <button
                type="button"
                onClick={() => onToggle(o.id)}
                className="text-indigo-400 transition-colors hover:text-indigo-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                {query ? 'No matches found' : 'All selected or none available'}
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-indigo-50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onToggle(o.id);
                    setQuery('');
                  }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                  <span className="flex-1 truncate font-medium text-slate-800">{o.label}</span>
                  {o.sub && (
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">{o.sub}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PartnerAdminFormProps {
  existing?: PartnerAdmin;
  onSaved: () => void;
  onCancel: () => void;
}

export function PartnerAdminForm({
  existing,
  onSaved,
  onCancel,
}: PartnerAdminFormProps) {
  const initialType = existing?.type?.trim() || '';
  const presetMatch = PARTNER_TYPES.includes(
    initialType as (typeof PARTNER_TYPES)[number]
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(
    existing?.description ?? ''
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    existing?.websiteUrl ?? ''
  );

  const [typePreset, setTypePreset] = useState<
    (typeof PARTNER_TYPES)[number] | 'CUSTOM'
  >(presetMatch ? (initialType as any) : 'CUSTOM');

  const [typeCustom, setTypeCustom] = useState(
    presetMatch ? '' : initialType
  );

  const [sortOrder, setSortOrder] = useState(
    String(existing?.sortOrder ?? 0)
  );

  const [isActive, setIsActive] = useState(
    existing?.isActive !== false
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [bookOptions, setBookOptions] = useState<Option[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [revenueSharePercent, setRevenueSharePercent] = useState<string>(String(existing?.revenueSharePercent ?? ''));

  useEffect(() => {
    const c = new Set<string>();
    existing?.partnerCourses?.forEach((x) => c.add(x.course.id));
    const bk = new Set<string>();
    existing?.partnerBooks?.forEach((x) => bk.add(x.bookId));
    setSelectedCourseIds(c);
    setSelectedBookIds(bk);
  }, [existing?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cr, br] = await Promise.all([
          getCourses({ limit: 500 }),
          getBooks({ limit: 500 }),
        ]);
        if (cancelled) return;
        if (cr.success && cr.data)
          setCourseOptions(cr.data.map((x) => ({ id: x.id, label: x.name })));
        if (br.success && br.data)
          setBookOptions(br.data.map((x) => ({ id: x.id, label: x.name, sub: x.sku })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedType =
    typePreset === 'CUSTOM' ? typeCustom.trim() : typePreset;

  const submit = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Partner name is required');
      return;
    }

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      fd.append('websiteUrl', websiteUrl.trim());
      fd.append('type', resolvedType);
      fd.append('sortOrder', String(parseInt(sortOrder) || 0));
      fd.append('isActive', String(isActive));

      if (logoFile) fd.append('logo', logoFile);

      fd.append('courseIds', JSON.stringify([...selectedCourseIds]));
      fd.append('bookIds', JSON.stringify([...selectedBookIds]));
      if (revenueSharePercent.trim()) fd.append('revenueSharePercent', revenueSharePercent.trim());

      if (existing) {
        await updatePartner(existing.id, fd);
      } else {
        await createPartner(fd);
      }

      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-linear-to-r from-red-50 to-rose-100 border border-red-200 p-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* ACTIVE TOGGLE */}
      <div className="flex items-center justify-between rounded-2xl p-4 bg-slate-900 text-white border border-slate-800 shadow-lg shadow-slate-900/30">
        <div>
          <p className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-300" /> Show on homepage
          </p>
          <p className="text-xs text-slate-300">
            Only active partners will be visible
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      {/* MAIN CARD */}
      <div className="rounded-3xl p-6 md:p-8 space-y-6 bg-white shadow-[0_18px_55px_-24px_rgba(0,0,0,0.25)] border border-slate-100">

        {/* NAME + TYPE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Partner Name
            </label>
            <Input
              className="mt-1 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. bKash"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Category
            </label>
            <Select
              value={typePreset}
              onValueChange={(v) =>
                setTypePreset(
                  v as (typeof PARTNER_TYPES)[number] | 'CUSTOM'
                )
              }
            >
              <SelectTrigger className="mt-1 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-400">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CUSTOM TYPE */}
        {typePreset === 'CUSTOM' && (
          <Input
            className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-300"
            placeholder="Custom category"
            value={typeCustom}
            onChange={(e) => setTypeCustom(e.target.value)}
          />
        )}

        {/* WEBSITE */}
        <div>
          <label className="text-xs font-semibold text-slate-700">
            Website
          </label>
          <div className="relative mt-1">
            <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4" />
            <Input
              className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-400"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </div>

        {/* SORT + LOGO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Sort Order
            </label>
            <Input
              type="number"
              className="h-12 rounded-xl mt-1 border-slate-200 focus:ring-2 focus:ring-indigo-400"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Logo
            </label>
            <label className="mt-1 flex items-center gap-3 border-2 border-dashed border-indigo-200 rounded-xl h-12 px-3 cursor-pointer hover:bg-indigo-50 transition">
              <Upload className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-slate-600 truncate">
                {logoFile ? logoFile.name : 'Upload logo'}
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  setLogoFile(e.target.files?.[0] || null)
                }
              />
            </label>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-xs font-semibold text-slate-700">
            Description
          </label>
          <Textarea
            className="mt-1 rounded-xl min-h-30 border-slate-200 focus:ring-2 focus:ring-indigo-300"
            placeholder="Short description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* REVENUE SHARE */}
        <div>
          <label className="text-xs font-semibold text-slate-700">Revenue Share (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="mt-1 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-400"
            placeholder="e.g. 15 (optional)"
            value={revenueSharePercent}
            onChange={(e) => setRevenueSharePercent(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">Optional. Defines partner's share of book/course revenue.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
              <BookOpen className="h-4 w-4" />
              Courses
              {selectedCourseIds.size > 0 && (
                <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                  {selectedCourseIds.size} selected
                </span>
              )}
            </div>
            <SearchMultiSelect
              options={courseOptions}
              selected={selectedCourseIds}
              onToggle={(id) =>
                setSelectedCourseIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              placeholder="Search courses…"
              icon={BookOpen}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
              <Library className="h-4 w-4" />
              Books
              {selectedBookIds.size > 0 && (
                <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                  {selectedBookIds.size} selected
                </span>
              )}
            </div>
            <SearchMultiSelect
              options={bookOptions}
              selected={selectedBookIds}
              onToggle={(id) =>
                setSelectedBookIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              placeholder="Search books…"
              icon={Library}
            />
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4 flex justify-end gap-3 z-10 mt-8">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl"
        >
          Cancel
        </Button>

        <Button
          onClick={submit}
          disabled={saving}
          className="rounded-xl px-6 bg-linear-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:opacity-90"
        >
          {saving
            ? 'Saving...'
            : existing
            ? 'Save Changes'
            : 'Add Partner'}
        </Button>
      </div>
    </div>
  );
}
