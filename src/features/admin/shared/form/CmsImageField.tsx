'use client';

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Link2, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadSiteContentImage } from '@/lib/api/site-content';
import { API_ORIGIN } from '@/lib/api';
import { cn } from '@/lib/utils';

export function resolveCmsImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/images/')) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function isCmsImageSettingKey(key: string): boolean {
  return (
    key.endsWith('logo_url') ||
    key.endsWith('image_url') ||
    key.endsWith('_image') ||
    key.includes('.image_') ||
    key === 'about.hero_video_url'
  );
}

interface CmsImageFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  /** Compact layout for dense admin forms */
  compact?: boolean;
}

export function CmsImageField({
  id,
  label,
  value,
  onChange,
  placeholder = 'https://… or /uploads/…',
  className,
  compact = false,
}: CmsImageFieldProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'upload'>(() =>
    value && (value.startsWith('http://') || value.startsWith('https://')) ? 'url' : 'upload',
  );
  const [uploading, setUploading] = useState(false);
  const previewSrc = resolveCmsImageUrl(value);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadSiteContentImage(file);
      onChange(res.imageUrl);
      toast({ title: 'Image uploaded' });
    } catch (err: unknown) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <Label htmlFor={id} className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            {label}
          </Label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors',
              mode === 'url' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Link2 className="h-3 w-3" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors',
              mode === 'upload' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!uploading) fileRef.current?.click();
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer transition-colors hover:border-violet-400 hover:bg-violet-50/40',
            compact ? 'p-4' : 'p-5',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-400" />
          )}
          <p className="text-[11px] font-bold text-slate-500">
            {uploading ? 'Uploading…' : 'Click to upload image (max 10 MB)'}
          </p>
          <input
            ref={fileRef}
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </div>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm border-slate-200 focus-visible:ring-violet-400"
        />
      )}

      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt="Preview"
          className={cn(
            'w-auto rounded-xl border border-slate-200 object-contain bg-white',
            compact ? 'h-14' : 'h-20',
          )}
        />
      ) : null}
    </div>
  );
}
