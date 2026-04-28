'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { getAdminPrivacyPolicy, savePrivacyPolicy } from '@/lib/api/privacy-policy';

export function PrivacyPolicyEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAdminPrivacyPolicy();
        if (cancelled || !res.success || !res.data) return;
        setTitle(res.data.title);
        setContent(res.data.content ?? '');
        setActive(res.data.status === 'ACTIVE');
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load privacy policy',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      toast({
        title: 'Validation',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await savePrivacyPolicy({
        title: t,
        content,
        status: active ? 'ACTIVE' : 'INACTIVE',
      });
      toast({ title: 'Saved', description: 'Privacy policy updated.' });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save privacy policy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <Label htmlFor="pp-title">Page title</Label>
        <Input
          id="pp-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="প্রাইভেসি পলিসি"
          className="max-w-xl"
        />
        <p className="text-xs text-slate-500">Shown in the page hero and browser context.</p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 w-fit">
        <Checkbox
          id="pp-active"
          checked={active}
          onCheckedChange={(v) => setActive(v === true)}
        />
        <Label htmlFor="pp-active" className="text-sm font-medium cursor-pointer">
          Published (visible on /privacy-policy)
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write the privacy policy…"
          className="min-h-[380px] rounded-xl border border-slate-200 bg-white overflow-hidden"
        />
      </div>

      <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
        {saving ? 'Saving…' : 'Save privacy policy'}
      </Button>
    </form>
  );
}
