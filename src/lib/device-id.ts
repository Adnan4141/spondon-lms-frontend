const STORAGE_KEY = 'mathlab_device_id';

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing && existing.trim().length >= 16) {
    return existing.trim();
  }

  const next = createDeviceId();
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}
