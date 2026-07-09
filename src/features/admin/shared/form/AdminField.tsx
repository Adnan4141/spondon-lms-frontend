import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const ADMIN_FIELD_CLASS = 'h-9 rounded-xl border-slate-200 bg-white text-sm';

export const AdminInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ className, ...props }, ref) => {
    return <Input ref={ref} className={cn(ADMIN_FIELD_CLASS, className)} {...props} />;
  },
);
AdminInput.displayName = 'AdminInput';

export const AdminSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  React.ComponentProps<typeof SelectTrigger>
>(({ className, ...props }, ref) => {
  return <SelectTrigger ref={ref} className={cn(ADMIN_FIELD_CLASS, className)} {...props} />;
});
AdminSelectTrigger.displayName = 'AdminSelectTrigger';

interface AdminFieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function AdminField({ label, htmlFor, className, children }: AdminFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  // Use noon to prevent day shifting due to timezone/UTC conversions.
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseMonthValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return undefined;
  // Use noon to prevent day shifting due to timezone/UTC conversions.
  const date = new Date(y, m - 1, 1, 12, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateValue(date?: Date): string {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

function formatMonthValue(date?: Date): string {
  if (!date) return '';
  return format(date, 'yyyy-MM');
}

interface AdminDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AdminDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled,
}: AdminDatePickerProps) {
  const selected = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            ADMIN_FIELD_CLASS,
            'w-full justify-start px-3 text-left font-normal',
            !value && 'text-slate-400',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'dd MMM yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border border-slate-200 p-0 shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(formatDateValue(date))}
        />
      </PopoverContent>
    </Popover>
  );
}

interface AdminMonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AdminMonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className,
  disabled,
}: AdminMonthPickerProps) {
  const selected = parseMonthValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            ADMIN_FIELD_CLASS,
            'w-full justify-start px-3 text-left font-normal',
            !value && 'text-slate-400',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'MMM yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border border-slate-200 p-0 shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(formatMonthValue(date))}
        />
      </PopoverContent>
    </Popover>
  );
}
