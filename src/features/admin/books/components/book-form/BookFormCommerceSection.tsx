import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { CreateBookDto, UpdateBookDto } from '@/lib/api/books';
import { BookOpen, Check, FileText, Sparkles, WalletCards } from 'lucide-react';
import { BookFormField } from './BookFormField';
import { BookFormSectionCard } from './BookFormSectionCard';

export function BookFormCommerceSection({
  form,
  setForm,
  isEbook,
}: {
  form: CreateBookDto | UpdateBookDto;
  setForm: Dispatch<SetStateAction<CreateBookDto | UpdateBookDto>>;
  isEbook: boolean;
}) {
  return (
    <BookFormSectionCard
      tone="emerald"
      icon={WalletCards}
      title="Commerce & format"
      subtitle="Printed vs digital, central stock, prices in ৳, and featured spotlight."
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Format</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, isEbook: false }))}
          className={cn(
            'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md',
            !isEbook
              ? 'border-primary bg-primary/8 shadow-md ring-2 ring-primary/25'
              : 'border-border/80 bg-muted/25 hover:border-primary/35',
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Printed book</p>
            <p className="text-xs text-muted-foreground">Warehouse quantity & physical delivery.</p>
          </div>
          {!isEbook ? <Check className="ml-auto h-5 w-5 shrink-0 text-primary" /> : null}
        </button>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, isEbook: true, centralQty: 0 }))}
          className={cn(
            'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md',
            isEbook
              ? 'border-primary bg-primary/8 shadow-md ring-2 ring-primary/25'
              : 'border-border/80 bg-muted/25 hover:border-primary/35',
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">E-book (PDF)</p>
            <p className="text-xs text-muted-foreground">Digital access; stock field hidden.</p>
          </div>
          {isEbook ? <Check className="ml-auto h-5 w-5 shrink-0 text-primary" /> : null}
        </button>
      </div>

      <div className="h-px w-full bg-border/70" role="separator" />

      <div className="grid gap-4 sm:grid-cols-2">
        <BookFormField
          label="Central stock"
          hint={isEbook ? 'Not used for digital titles.' : 'Units at the central warehouse.'}
        >
          <Input
            type="number"
            min={0}
            disabled={isEbook}
            value={String(form.centralQty ?? 0)}
            onChange={(e) => setForm((p) => ({ ...p, centralQty: Math.max(0, Number(e.target.value || 0)) }))}
            className="h-11 rounded-xl border-border/80 bg-background/80 shadow-sm disabled:opacity-60"
          />
        </BookFormField>
        <BookFormField label="Sale price" hint="What customers pay (৳).">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              ৳
            </span>
            <Input
              type="number"
              min={0}
              value={String(form.price ?? 0)}
              onChange={(e) => setForm((p) => ({ ...p, price: Math.max(0, Number(e.target.value || 0)) }))}
              className="h-11 rounded-xl border-border/80 bg-background/80 pl-8 shadow-sm"
            />
          </div>
        </BookFormField>
        <BookFormField label="MRP" optional hint="Optional list price; struck-through when above sale price.">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              ৳
            </span>
            <Input
              type="number"
              min={0}
              value={form.mrp == null ? '' : String(form.mrp)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  mrp: e.target.value ? Math.max(0, Number(e.target.value)) : undefined,
                }))
              }
              placeholder="List price"
              className="h-11 rounded-xl border-border/80 bg-background/80 pl-8 shadow-sm"
            />
          </div>
        </BookFormField>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-linear-to-r from-amber-50/95 to-orange-50/50 px-4 py-4 sm:col-span-2 dark:border-amber-900/55 dark:from-amber-950/45 dark:to-orange-950/25">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Feature on storefront</p>
              <p className="text-xs text-muted-foreground">Highlights this title in discovery and category rails.</p>
            </div>
          </div>
          <Switch
            checked={Boolean(form.featured)}
            onCheckedChange={(checked) => setForm((p) => ({ ...p, featured: checked }))}
          />
        </div>
      </div>
    </BookFormSectionCard>
  );
}
