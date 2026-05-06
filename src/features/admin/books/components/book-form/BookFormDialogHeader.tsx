import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  ImageIcon,
  Layers3,
  GraduationCap,
  ScanLine,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BookFormDialogHeader({
  title,
  description,
  completedSections,
  totalSections,
  nextIncompleteTitle,
  isEbook,
  selectedCategoryName,
  selectedProgramName,
  coverUrl,
  sku,
  price,
}: {
  title: string;
  description: string;
  completedSections: number;
  totalSections: number;
  nextIncompleteTitle?: string;
  isEbook: boolean;
  selectedCategoryName?: string;
  selectedProgramName?: string;
  coverUrl?: string | null;
  sku?: string | null;
  price: number;
}) {
  const FormatIcon = isEbook ? FileText : BookOpen;

  return (
    <header className="shrink-0 border-b border-border/60 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-3 py-2.5 dark:from-violet-950/20 dark:via-background dark:to-cyan-950/20">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="hidden h-14 w-10 shrink-0 overflow-hidden rounded-md border border-white/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:block">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-600 dark:from-violet-950/30 dark:to-cyan-950/30 dark:text-violet-300">
                <ImageIcon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            {/* Badges */}
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <Badge className="h-5 rounded-md bg-violet-600 px-1.5 text-[10px] font-medium text-white hover:bg-violet-600">
                {completedSections}/{totalSections}
              </Badge>

              {nextIncompleteTitle ? (
                <Badge
                  variant="outline"
                  className="h-5 rounded-md border-amber-200 bg-amber-50 px-1.5 text-[10px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  Next: {nextIncompleteTitle}
                </Badge>
              ) : (
                <Badge className="h-5 rounded-md bg-emerald-600 px-1.5 text-[10px] font-medium text-white hover:bg-emerald-600">
                  Ready
                </Badge>
              )}

              <Badge
                variant="outline"
                className="h-5 rounded-md border-cyan-200 bg-cyan-50 px-1.5 text-[10px] font-medium text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200"
              >
                <FormatIcon className="mr-1 h-3 w-3" />
                {isEbook ? 'E-book' : 'Printed'}
              </Badge>
            </div>

            {/* Title */}
            <h2 className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
              {title}
            </h2>

            {/* Description */}
            <p className="line-clamp-1 max-w-xl text-[11px] text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:w-[460px]">
          <HeaderFact
            icon={Layers3}
            label="Category"
            value={selectedCategoryName || 'Uncategorized'}
            tone="violet"
          />

          <HeaderFact
            icon={GraduationCap}
            label="Program"
            value={selectedProgramName || 'No program'}
            tone="cyan"
          />

          <HeaderFact
            icon={ScanLine}
            label="SKU"
            value={sku?.trim() || 'Not set'}
            tone="amber"
          />

          <HeaderFact
            icon={Wallet}
            label="Price"
            value={`৳${Number(price || 0).toLocaleString()}`}
            tone="emerald"
          />
        </div>
      </div>
    </header>
  );
}

const factStyles = {
  violet:
    'border-violet-200 bg-violet-50/80 text-violet-950 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-100',
  cyan:
    'border-cyan-200 bg-cyan-50/80 text-cyan-950 dark:border-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-100',
  amber:
    'border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100',
  emerald:
    'border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100',
} as const;

function HeaderFact({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof factStyles;
  icon: any;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1.5 shadow-xs',
        factStyles[tone]
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/70 dark:bg-black/10">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
          {label}
        </p>

        <p className="truncate text-[11px] font-bold">{value}</p>
      </div>
    </div>
  );
}