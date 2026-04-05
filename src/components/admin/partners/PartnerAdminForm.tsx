'use client';

import { useState, useEffect } from 'react';
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
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { Checkbox } from '@/components/ui/checkbox';
import { getBooks } from '@/lib/api/books';
import { Globe2, Upload, Sparkles, GraduationCap, BookOpen, Library } from 'lucide-react';

const PARTNER_TYPES = [
  'MEDIA',
  'TELECOM',
  'PAYMENT',
  'EDUCATION',
  'HARDWARE',
  'OTHER',
] as const;

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

  const [programOptions, setProgramOptions] = useState<{ id: string; name: string }[]>([]);
  const [courseOptions, setCourseOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<Set<string>>(new Set());
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [bookOptions, setBookOptions] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [revenueSharePercent, setRevenueSharePercent] = useState<string>(String(existing?.revenueSharePercent ?? ''));

  useEffect(() => {
    const p = new Set<string>();
    const c = new Set<string>();
    existing?.partnerPrograms?.forEach((x) => p.add(x.program.id));
    existing?.partnerCourses?.forEach((x) => c.add(x.course.id));
    const bk = new Set<string>();
    existing?.partnerBooks?.forEach((x) => bk.add(x.bookId));
    setSelectedProgramIds(p);
    setSelectedCourseIds(c);
    setSelectedBookIds(bk);
  }, [existing?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pr, cr, br] = await Promise.all([
          getPrograms(),
          getCourses({ limit: 500 }),
          getBooks({ limit: 500 }),
        ]);
        if (cancelled) return;
        if (pr.success && pr.data) setProgramOptions(pr.data.map((x) => ({ id: x.id, name: x.name })));
        if (cr.success && cr.data) setCourseOptions(cr.data.map((x) => ({ id: x.id, name: x.name })));
        if (br.success && br.data) setBookOptions(br.data.map((x) => ({ id: x.id, name: x.name, sku: x.sku })));
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

      fd.append('programIds', JSON.stringify([...selectedProgramIds]));
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
        <div className="rounded-xl bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 p-3 text-sm text-red-700 shadow-sm">
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
            className="mt-1 rounded-xl min-h-[120px] border-slate-200 focus:ring-2 focus:ring-indigo-300"
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

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
              <GraduationCap className="h-4 w-4" />
              Programs (collaboration)
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {programOptions.length === 0 ? (
                <p className="text-xs text-slate-400">No programs loaded</p>
              ) : (
                programOptions.map((prog) => (
                  <label
                    key={prog.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-white"
                  >
                    <Checkbox
                      checked={selectedProgramIds.has(prog.id)}
                      onCheckedChange={(checked) => {
                        setSelectedProgramIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(prog.id);
                          else next.delete(prog.id);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm font-medium text-slate-800">{prog.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
              <BookOpen className="h-4 w-4" />
              Courses (collaboration)
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {courseOptions.length === 0 ? (
                <p className="text-xs text-slate-400">No courses loaded</p>
              ) : (
                courseOptions.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-white"
                  >
                    <Checkbox
                      checked={selectedCourseIds.has(c.id)}
                      onCheckedChange={(checked) => {
                        setSelectedCourseIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(c.id);
                          else next.delete(c.id);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm font-medium text-slate-800">{c.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Books */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
              <Library className="h-4 w-4" />
              Books (collaboration)
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {bookOptions.length === 0 ? (
                <p className="text-xs text-slate-400">No books loaded</p>
              ) : (
                bookOptions.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-white"
                  >
                    <Checkbox
                      checked={selectedBookIds.has(b.id)}
                      onCheckedChange={(checked) => {
                        setSelectedBookIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(b.id);
                          else next.delete(b.id);
                          return next;
                        });
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate block">{b.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{b.sku}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
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
          className="rounded-xl px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:opacity-90"
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
