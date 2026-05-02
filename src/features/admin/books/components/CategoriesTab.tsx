'use client';

import { useState } from 'react';
import { createBookCategory, deleteBookCategory, updateBookCategory, type BookCategory } from '@/lib/api/books';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function CategoriesTab({
  categories,
  onRefresh,
}: {
  categories: BookCategory[];
  onRefresh: () => Promise<void>;
}) {
  const toast = useAdminToast();
  const [form, setForm] = useState({ id: '', name: '', slug: '', description: '', sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({ id: '', name: '', slug: '', description: '', sortOrder: 0 });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Category name required', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder || 0),
      };
      if (form.id) {
        await updateBookCategory(form.id, payload);
      } else {
        await createBookCategory(payload);
      }
      await onRefresh();
      reset();
      toast({ title: form.id ? 'Category updated' : 'Category created', variant: 'success' });
    } catch (error) {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBookCategory(id);
      await onRefresh();
      toast({ title: 'Category deleted', variant: 'success' });
    } catch (error) {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-5">
          <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value, slug: prev.id ? prev.slug : slugify(e.target.value) }))} placeholder="Category name" />
          <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="slug" />
          <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" />
          <Input type="number" value={String(form.sortOrder)} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))} placeholder="Sort order" />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : form.id ? 'Update' : 'Add'}</Button>
            {form.id ? <Button variant="outline" onClick={reset}>Cancel</Button> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Books</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-semibold">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.description || '—'}</TableCell>
                <TableCell>{category._count?.books ?? 0}</TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setForm({ id: category.id, name: category.name, slug: category.slug, description: category.description || '', sortOrder: category.sortOrder || 0 })}>Edit</Button>
                    <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(category.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}