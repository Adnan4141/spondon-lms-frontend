'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getProgramCards,
  createProgramCard,
  updateProgramCard,
  deleteProgramCard,
  uploadSiteContentImage,
  type HeroSlide,
  type ProgramCard,
  type HeroSlideInput,
  type ProgramCardInput,
} from '@/lib/api/site-content';
import { API_ORIGIN } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import {
  Pencil,
  Trash2,
  Plus,
  ImageIcon,
  Link2,
  Upload,
  Loader2,
  LayoutTemplate,
  RefreshCw,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ───────────────────────────────────────────────────────────────

function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/images/')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

const BG_COLOR_OPTIONS = [
  { value: 'bg-indigo-50', label: 'Indigo' },
  { value: 'bg-emerald-50', label: 'Emerald' },
  { value: 'bg-orange-50', label: 'Orange' },
  { value: 'bg-cyan-50', label: 'Cyan' },
  { value: 'bg-rose-50', label: 'Rose' },
  { value: 'bg-violet-50', label: 'Violet' },
  { value: 'bg-amber-50', label: 'Amber' },
  { value: 'bg-sky-50', label: 'Sky' },
  { value: 'bg-teal-50', label: 'Teal' },
  { value: 'bg-lime-50', label: 'Lime' },
];

// ─── Image Picker Component ────────────────────────────────────────────────

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
}

function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.startsWith('/images/') ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value && mode === 'url' ? value : '');
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const previewSrc = resolveImageUrl(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await uploadSiteContentImage(file);
      onChange(result.imageUrl);
      toast({ title: 'Image uploaded', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUrlApply = () => {
    onChange(urlInput.trim());
  };

  return (
    <div className="space-y-3">
      <RadioGroup
        value={mode}
        onValueChange={(v) => setMode(v as 'upload' | 'url')}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="upload" id="mode-upload" />
          <Label htmlFor="mode-upload" className="flex items-center gap-1.5 cursor-pointer font-bold text-sm">
            <Upload className="h-3.5 w-3.5" />
            Upload file
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="url" id="mode-url" />
          <Label htmlFor="mode-url" className="flex items-center gap-1.5 cursor-pointer font-bold text-sm">
            <Link2 className="h-3.5 w-3.5" />
            Image URL
          </Label>
        </div>
      </RadioGroup>

      {mode === 'upload' ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-400" />
          )}
          <p className="text-xs font-bold text-slate-500">
            {uploading ? 'Uploading…' : 'Click to select an image (max 10 MB)'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="rounded-xl font-medium text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlApply}
            className="rounded-xl shrink-0"
          >
            Apply
          </Button>
        </div>
      )}

      {previewSrc && (
        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <Image src={previewSrc} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => { onChange(''); setUrlInput(''); }}
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white/80 flex items-center justify-center text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-all text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Hero Slide Form ───────────────────────────────────────────────────────

interface HeroSlideFormProps {
  initial?: HeroSlide | null;
  onSave: (data: HeroSlideInput) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function HeroSlideForm({ initial, onSave, onClose, saving }: HeroSlideFormProps) {
  const [form, setForm] = useState<HeroSlideInput>({
    title: initial?.title ?? '',
    imageUrl: initial?.imageUrl ?? '',
  });

  const set = (k: keyof HeroSlideInput, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void onSave(form); }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Title</Label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="এখানে টাইটেল লিখুন" className="rounded-xl" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Background Image</Label>
        <ImagePicker value={form.imageUrl ?? ''} onChange={(url) => set('imageUrl', url)} />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
        <Button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {initial ? 'Save changes' : 'Create slide'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Program Card Form ─────────────────────────────────────────────────────

interface ProgramCardFormProps {
  initial?: ProgramCard | null;
  onSave: (data: ProgramCardInput) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function ProgramCardForm({ initial, onSave, onClose, saving }: ProgramCardFormProps) {
  const [form, setForm] = useState<ProgramCardInput>({
    title: initial?.title ?? '',
    subtitle: initial?.subtitle ?? '',
    bgColor: initial?.bgColor ?? 'bg-indigo-50',
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });

  const set = (k: keyof ProgramCardInput, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void onSave(form); }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Program Title</Label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="প্রোগ্রামের নাম" className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Subtitle</Label>
        <Input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} required placeholder="সংক্ষিপ্ত বিবরণ" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Background Color</Label>
          <Select value={form.bgColor} onValueChange={(v) => set('bgColor', v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {BG_COLOR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-4 w-4 rounded-full border border-slate-200', opt.value)} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Sort Order</Label>
          <Input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="rounded-xl" min={0} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} />
        <Label className="text-sm font-bold text-slate-700">Active</Label>
      </div>

      {/* Live preview */}
      {form.title && (
        <div className={cn('rounded-2xl p-4 border border-slate-100 flex items-start gap-3', form.bgColor)}>
          <div className="h-10 w-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-inner border border-slate-100 text-xs font-black shrink-0">CMS</div>
          <div>
            <p className="text-sm font-black text-slate-900">{form.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{form.subtitle}</p>
          </div>
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
        <Button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {initial ? 'Save changes' : 'Create card'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function LandingCMSPage() {
  const { toast, toasts, removeToast } = useToast();

  // Hero slides state
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(true);
  const [slideDialog, setSlideDialog] = useState(false);
  const [editSlide, setEditSlide] = useState<HeroSlide | null>(null);
  const [savingSlide, setSavingSlide] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);

  // Program cards state
  const [cards, setCards] = useState<ProgramCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardDialog, setCardDialog] = useState(false);
  const [editCard, setEditCard] = useState<ProgramCard | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // ── Data loaders ──────────────────────────────────────────────────────

  const loadSlides = useCallback(async () => {
    try {
      setSlidesLoading(true);
      const res = await getHeroSlides(true);
      if (res.success) setSlides(res.data ?? []);
    } catch { /* ignore */ }
    finally { setSlidesLoading(false); }
  }, []);

  const loadCards = useCallback(async () => {
    try {
      setCardsLoading(true);
      const res = await getProgramCards(true);
      if (res.success) setCards(res.data ?? []);
    } catch { /* ignore */ }
    finally { setCardsLoading(false); }
  }, []);

  useEffect(() => { void loadSlides(); }, [loadSlides]);
  useEffect(() => { void loadCards(); }, [loadCards]);

  // ── Hero slide actions ────────────────────────────────────────────────

  const handleSaveSlide = async (data: HeroSlideInput) => {
    try {
      setSavingSlide(true);
      if (editSlide) {
        await updateHeroSlide(editSlide.id, data);
        toast({ title: 'Slide updated', variant: 'success' });
      } else {
        await createHeroSlide(data);
        toast({ title: 'Slide created', variant: 'success' });
      }
      setSlideDialog(false);
      setEditSlide(null);
      await loadSlides();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingSlide(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    try {
      setDeletingSlideId(id);
      await deleteHeroSlide(id);
      toast({ title: 'Slide deleted', variant: 'success' });
      await loadSlides();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingSlideId(null);
    }
  };

  // ── Program card actions ──────────────────────────────────────────────

  const handleSaveCard = async (data: ProgramCardInput) => {
    try {
      setSavingCard(true);
      if (editCard) {
        await updateProgramCard(editCard.id, data);
        toast({ title: 'Card updated', variant: 'success' });
      } else {
        await createProgramCard(data);
        toast({ title: 'Card created', variant: 'success' });
      }
      setCardDialog(false);
      setEditCard(null);
      await loadCards();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      setDeletingCardId(id);
      await deleteProgramCard(id);
      toast({ title: 'Card deleted', variant: 'success' });
      await loadCards();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingCardId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 text-slate-900">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Landing Page CMS</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage hero slides &amp; program cards</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="hero-slides">
        <TabsList className="rounded-2xl bg-slate-100 p-1">
          <TabsTrigger value="hero-slides" className="rounded-xl text-sm font-black uppercase tracking-widest text-[10px]">
            Hero Slides
          </TabsTrigger>
          <TabsTrigger value="program-cards" className="rounded-xl text-sm font-black uppercase tracking-widest text-[10px]">
            Program Cards
          </TabsTrigger>
        </TabsList>

        {/* ── Hero Slides Tab ───────────────────────────────────────── */}
        <TabsContent value="hero-slides" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{slides.length} slide{slides.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadSlides} className="rounded-xl h-9 gap-1.5">
                <RefreshCw className={cn('h-3.5 w-3.5', slidesLoading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditSlide(null); setSlideDialog(true); }}
                className="rounded-xl h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Slide
              </Button>
            </div>
          </div>

          {slidesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            </div>
          ) : slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-3xl border-2 border-dashed border-slate-200">
              <ImageIcon className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-black text-slate-400 text-sm">No hero slides yet</p>
              <p className="text-xs text-slate-300 mt-1">Add your first slide to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />

                  {/* Thumbnail */}
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                    {slide.imageUrl ? (
                      <Image
                        src={resolveImageUrl(slide.imageUrl)}
                        alt={slide.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-900 text-sm truncate">{slide.title}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0',
                          slide.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        )}
                      >
                        {slide.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-indigo-600 font-bold truncate">{slide.highlight}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{slide.subtitle}</p>
                  </div>

                  {/* Sort order badge */}
                  <div className="shrink-0 text-[10px] font-black text-slate-400 bg-slate-100 rounded-lg px-2.5 py-1">
                    #{slide.sortOrder}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl"
                      onClick={() => { setEditSlide(slide); setSlideDialog(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                      onClick={() => void handleDeleteSlide(slide.id)}
                      disabled={deletingSlideId === slide.id}
                    >
                      {deletingSlideId === slide.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Program Cards Tab ─────────────────────────────────────── */}
        <TabsContent value="program-cards" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{cards.length} card{cards.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadCards} className="rounded-xl h-9 gap-1.5">
                <RefreshCw className={cn('h-3.5 w-3.5', cardsLoading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditCard(null); setCardDialog(true); }}
                className="rounded-xl h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Card
              </Button>
            </div>
          </div>

          {cardsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-3xl border-2 border-dashed border-slate-200">
              <LayoutTemplate className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-black text-slate-400 text-sm">No program cards yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={cn('group relative rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all', card.bgColor)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-lg text-[9px] font-black uppercase tracking-widest',
                        card.isActive
                          ? 'bg-white text-emerald-700 border-emerald-100'
                          : 'bg-white text-slate-400 border-slate-200'
                      )}
                    >
                      {card.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-400 bg-white/60 rounded-lg px-2 py-0.5">#{card.sortOrder}</span>
                  </div>
                  <p className="font-black text-slate-900 text-sm leading-snug">{card.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{card.subtitle}</p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-xl bg-white/80 text-xs gap-1"
                      onClick={() => { setEditCard(card); setCardDialog(true); }}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-xl bg-white/80 text-xs gap-1 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                      onClick={() => void handleDeleteCard(card.id)}
                      disabled={deletingCardId === card.id}
                    >
                      {deletingCardId === card.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />}
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Hero Slide Dialog ──────────────────────────────────────── */}
      <Dialog open={slideDialog} onOpenChange={(o) => { if (!o) { setSlideDialog(false); setEditSlide(null); } }}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <HeroSlideForm
              initial={editSlide}
              onSave={handleSaveSlide}
              onClose={() => { setSlideDialog(false); setEditSlide(null); }}
              saving={savingSlide}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Program Card Dialog ────────────────────────────────────── */}
      <Dialog open={cardDialog} onOpenChange={(o) => { if (!o) { setCardDialog(false); setEditCard(null); } }}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editCard ? 'Edit Program Card' : 'Add Program Card'}
            </DialogTitle>
          </DialogHeader>
          <ProgramCardForm
            initial={editCard}
            onSave={handleSaveCard}
            onClose={() => { setCardDialog(false); setEditCard(null); }}
            saving={savingCard}
          />
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
