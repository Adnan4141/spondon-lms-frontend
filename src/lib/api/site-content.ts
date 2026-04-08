import { apiRequest, API_BASE_URL } from '../api';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: string;
  title: string;
  highlight: string;
  subtitle: string;
  imageUrl: string;
  btnText: string;
  secondaryBtnText: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramCard {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlideInput {
  title: string;
  imageUrl?: string;
  highlight?: string;
  subtitle?: string;
  btnText?: string;
  secondaryBtnText?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProgramCardInput {
  title: string;
  subtitle: string;
  bgColor?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ─── Image Upload ──────────────────────────────────────────────────────────

export async function uploadSiteContentImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE_URL}/site-content/upload-image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Upload failed (${res.status})`;
    try { msg = (JSON.parse(text) as { message?: string }).message || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const json = (await res.json()) as ApiResponse<{ imageUrl: string }>;
  if (!json.success || !json.data) throw new Error(json.message || 'Upload failed');
  return json.data;
}

// ─── Hero Slides ───────────────────────────────────────────────────────────

export async function getHeroSlides(includeInactive = false): Promise<ApiResponse<HeroSlide[]>> {
  const q = includeInactive ? '?includeInactive=true' : '';
  return apiRequest<ApiResponse<HeroSlide[]>>(`/site-content/hero-slides${q}`);
}

export async function createHeroSlide(data: HeroSlideInput): Promise<ApiResponse<HeroSlide>> {
  return apiRequest<ApiResponse<HeroSlide>>('/site-content/hero-slides', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHeroSlide(id: string, data: Partial<HeroSlideInput>): Promise<ApiResponse<HeroSlide>> {
  return apiRequest<ApiResponse<HeroSlide>>(`/site-content/hero-slides/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHeroSlide(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/site-content/hero-slides/${id}`, { method: 'DELETE' });
}

// ─── Program Cards ─────────────────────────────────────────────────────────

export async function getProgramCards(includeInactive = false): Promise<ApiResponse<ProgramCard[]>> {
  const q = includeInactive ? '?includeInactive=true' : '';
  return apiRequest<ApiResponse<ProgramCard[]>>(`/site-content/program-cards${q}`);
}

export async function createProgramCard(data: ProgramCardInput): Promise<ApiResponse<ProgramCard>> {
  return apiRequest<ApiResponse<ProgramCard>>('/site-content/program-cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProgramCard(id: string, data: Partial<ProgramCardInput>): Promise<ApiResponse<ProgramCard>> {
  return apiRequest<ApiResponse<ProgramCard>>(`/site-content/program-cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProgramCard(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/site-content/program-cards/${id}`, { method: 'DELETE' });
}
