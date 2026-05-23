export type SmsNumberValidation = {
  raw: string;
  normalized: string | null;
  valid: boolean;
  duplicate: boolean;
};

export function normalizeBdSmsNumber(input: unknown): string | null {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (!digits) return null;

  let local = digits;
  if (digits.startsWith('880') && digits.length === 13) local = `0${digits.slice(3)}`;
  else if (digits.startsWith('88') && digits.length === 13) local = digits.slice(2);
  else if (digits.startsWith('1') && digits.length === 10) local = `0${digits}`;

  if (!/^01[3-9]\d{8}$/.test(local)) return null;
  return `88${local}`;
}

export function parseSmsNumberText(value: string) {
  return value.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
}

export function validateSmsNumbers(value: string): {
  rows: SmsNumberValidation[];
  valid: string[];
  invalid: string[];
  duplicates: string[];
} {
  const seen = new Set<string>();
  const rows = parseSmsNumberText(value).map((raw) => {
    const normalized = normalizeBdSmsNumber(raw);
    const duplicate = !!normalized && seen.has(normalized);
    if (normalized && !duplicate) seen.add(normalized);
    return { raw, normalized, valid: !!normalized, duplicate };
  });

  return {
    rows,
    valid: rows.filter((row) => row.valid && !row.duplicate).map((row) => row.normalized!),
    invalid: rows.filter((row) => !row.valid).map((row) => row.raw),
    duplicates: rows.filter((row) => row.duplicate).map((row) => row.normalized || row.raw),
  };
}
