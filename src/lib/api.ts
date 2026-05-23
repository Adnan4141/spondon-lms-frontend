// Base API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function professionalApiMessage(message: string, body?: unknown) {
  if (body && typeof body === 'object' && 'code' in body) {
    const code = (body as { code?: unknown }).code;
    if (code === 'SMS_SCHEMA_MISMATCH') {
      return 'SMS database migration is pending. Please run the latest migrations before using SMS queue features.';
    }
    if (code === 'SMS_PROVIDER_NOT_CONFIGURED') {
      return 'SMS gateway is not configured. Add the API key in SMS Console > Settings.';
    }
  }

  if (/Invalid `prisma\.smsQueue\.findMany\(\)`|SmsQueue\.scheduledAt|column `SmsQueue\.scheduledAt` does not exist/i.test(message)) {
    return 'SMS database migration is pending. Please run the latest migrations before using SMS queue features.';
  }
  if (/No active SMS configuration|api key|sender ID not configured|Non-masking sender ID not configured|Masking sender ID not configured/i.test(message)) {
    return 'SMS gateway is not configured. Add the API key and sender details in SMS Console > Settings.';
  }
  return message;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  // Attach JWT token from localStorage if available
  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Redirect to login on 401 when on an admin page
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin')
    ) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    const raw = await response.text();
    let msg = '';
    let parsedBody: unknown;
    if (raw) {
      try {
        const body = JSON.parse(raw) as { message?: string; error?: unknown };
        parsedBody = body;
        if (body && typeof body === 'object') {
          const apiMsg = typeof body.message === 'string' ? body.message.trim() : '';
          const apiErr = typeof body.error === 'string' ? body.error.trim() : '';
          // Prefer concrete `error` (e.g. generator validation) over generic `message`.
          if (apiErr && apiMsg) msg = `${apiMsg}: ${apiErr}`;
          else msg = apiErr || apiMsg;
        }
      } catch {
        const snippet = raw.replace(/\s+/g, ' ').trim().slice(0, 200);
        msg = snippet;
      }
    }
    const errMsg = professionalApiMessage(msg || `Something went wrong (${response.status}). Try again.`, parsedBody);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message: errMsg, status: response.status } }));
    }
    throw new ApiError(errMsg, response.status, parsedBody);
  }

  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
