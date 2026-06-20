'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_OPTION_VALUE = '__all__';

function toSelectValue(value: string): string {
  return value === '' ? ALL_OPTION_VALUE : value;
}

function fromSelectValue(value: string): string {
  return value === ALL_OPTION_VALUE ? '' : value;
}

export function StudentAdminSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={toSelectValue(value)}
      onValueChange={(next) => onChange(fromSelectValue(next))}
      disabled={disabled}
    >
      <SelectTrigger className="w-full h-9 text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const itemValue = toSelectValue(o.value);
          return (
            <SelectItem key={itemValue} value={itemValue} disabled={o.disabled}>
              {o.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
