import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

export function BookFormFileDropZone({
  id,
  accept,
  label,
  sub,
  selectedName,
  onFile,
}: {
  id: string;
  accept: string;
  label: string;
  sub: string;
  selectedName?: string | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/25 bg-linear-to-br from-primary/5 via-muted/30 to-violet-500/5 px-4 py-5 text-center transition-all',
        'hover:border-primary/50 hover:from-primary/10 hover:shadow-md',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
      )}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-105">
        <Upload className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
      {selectedName ? (
        <Badge variant="secondary" className="mt-1 max-w-full truncate font-normal">
          {selectedName}
        </Badge>
      ) : null}
    </label>
  );
}
