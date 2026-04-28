'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  createFaq,
  deleteFaq,
  getAllFaqsAdmin,
  reorderFaqs,
  updateFaq,
  type FaqAdmin,
  type FaqStatus,
} from '@/lib/api/faq';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';

function SortableFaqRow({
  faq,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  faq: FaqAdmin;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (next: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: faq.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold text-slate-900 line-clamp-2">{faq.question}</p>
        <p className="text-xs text-slate-500 line-clamp-2">{faq.answer}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Checkbox
            checked={faq.status === 'ACTIVE'}
            onCheckedChange={(v) => onToggleActive(v === true)}
          />
          Active
        </label>
        <span className="text-[10px] font-mono text-slate-400">#{faq.sortOrder}</span>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FaqManager() {
  const [items, setItems] = useState<FaqAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqAdmin | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [activeStatus, setActiveStatus] = useState<FaqStatus>('ACTIVE');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllFaqsAdmin();
      if (res.success && res.data) setItems(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load FAQs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setActiveStatus('ACTIVE');
    setDialogOpen(true);
  };

  const openEdit = (faq: FaqAdmin) => {
    setEditing(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setActiveStatus(faq.status);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    const a = answer.trim();
    if (!q || !a) {
      toast({ title: 'Validation', description: 'Question and answer are required', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updateFaq(editing.id, { question: q, answer: a, status: activeStatus });
        toast({ title: 'Saved', description: 'FAQ updated' });
      } else {
        await createFaq({ question: q, answer: a, status: activeStatus });
        toast({ title: 'Saved', description: 'FAQ created' });
      }
      setDialogOpen(false);
      load();
    } catch {
      toast({ title: 'Error', description: 'Could not save FAQ', variant: 'destructive' });
    }
  };

  const handleDelete = async (faq: FaqAdmin) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await deleteFaq(faq.id);
      toast({ title: 'Deleted', description: 'FAQ removed' });
      load();
    } catch {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (faq: FaqAdmin, nextActive: boolean) => {
    const nextStatus: FaqStatus = nextActive ? 'ACTIVE' : 'INACTIVE';
    try {
      await updateFaq(faq.id, { status: nextStatus });
      setItems((prev) => prev.map((x) => (x.id === faq.id ? { ...x, status: nextStatus } : x)));
      toast({ title: 'Updated', description: nextActive ? 'FAQ is active' : 'FAQ is inactive' });
    } catch {
      toast({ title: 'Error', description: 'Could not update status', variant: 'destructive' });
      load();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const payload = reordered.map((row, idx) => ({ id: row.id, sortOrder: idx }));
    try {
      await reorderFaqs(payload);
      toast({ title: 'Order saved', description: 'FAQ order updated' });
    } catch {
      toast({ title: 'Reorder failed', description: 'Refreshing list…', variant: 'destructive' });
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">FAQ Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag rows to reorder. Only active items appear on the public FAQ page.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-16 text-center text-slate-500 text-sm font-medium">
          No FAQs yet. Click &quot;Add FAQ&quot; to create the first entry.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((faq) => (
                <SortableFaqRow
                  key={faq.id}
                  faq={faq}
                  onEdit={() => openEdit(faq)}
                  onDelete={() => handleDelete(faq)}
                  onToggleActive={(on) => handleToggleActive(faq, on)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
              <DialogDescription>
                Questions and answers appear on the public /faq page when status is Active.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="faq-q">Question</Label>
                <Input
                  id="faq-q"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter question"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-a">Answer</Label>
                <Textarea
                  id="faq-a"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter answer"
                  rows={5}
                  required
                  className="resize-y"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Checkbox
                  checked={activeStatus === 'ACTIVE'}
                  onCheckedChange={(v) => setActiveStatus(v === true ? 'ACTIVE' : 'INACTIVE')}
                />
                Published (active on website)
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
