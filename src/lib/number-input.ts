export function isDecimalNumberStep(step?: string | number): boolean {
  if (step == null) return false;
  const s = String(step);
  return s === 'any' || s.includes('.');
}

export function formatNumberInputValue(value: unknown): string {
  if (value === '' || value == null) return '';
  return String(value);
}

export function normalizeIntegerInput(value: string, allowNegative = false): string {
  if (allowNegative) {
    const negative = value.startsWith('-');
    if (value === '-') return '-';
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    return negative && digits ? `-${digits}` : digits;
  }
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function normalizeDecimalInput(value: string, allowNegative = false): string {
  const negative = allowNegative && value.startsWith('-');
  if (allowNegative && value === '-') return '-';

  let body = value.replace(allowNegative ? /[^\d.]/g : /[^\d.]/g, '');
  const dotIndex = body.indexOf('.');
  if (dotIndex !== -1) {
    body = body.slice(0, dotIndex + 1) + body.slice(dotIndex + 1).replace(/\./g, '');
  }

  if (dotIndex === -1) {
    body = body.replace(/^0+(?=\d)/, '');
  } else {
    const [intPart = '', fracPart = ''] = body.split('.');
    const normalizedInt = intPart.replace(/^0+(?=\d)/, '') || '0';
    body = fracPart !== undefined && body.includes('.') ? `${normalizedInt}.${fracPart}` : normalizedInt;
  }

  if (negative && body) return `-${body}`;
  return body;
}

export function finalizeNumberInputValue(value: string): string {
  if (value === '' || value === '-') return value;
  if (value.endsWith('.')) return value.slice(0, -1);
  return value;
}

export function clampNumberInput(
  value: string,
  opts: { min?: string | number; max?: string | number; isDecimal?: boolean },
): string {
  const finalized = finalizeNumberInputValue(value);
  if (finalized === '' || finalized === '-') return finalized;

  const n = Number(finalized);
  if (!Number.isFinite(n)) return finalized;

  let clamped = n;
  if (opts.min !== undefined && opts.min !== '') clamped = Math.max(clamped, Number(opts.min));
  if (opts.max !== undefined && opts.max !== '') clamped = Math.min(clamped, Number(opts.max));

  if (clamped === n) return finalized;
  return opts.isDecimal ? String(clamped) : String(Math.trunc(clamped));
}

export function patchInputEventValue<E extends { target: HTMLInputElement; currentTarget: HTMLInputElement }>(
  event: E,
  value: string,
): E {
  return {
    ...event,
    target: Object.assign(event.target, { value }),
    currentTarget: Object.assign(event.currentTarget, { value }),
  };
}
