/** Current signed-in user id from localStorage (set at login). Used for server-side permission checks. */

export function getActorUserIdFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return undefined;
    const id = JSON.parse(raw)?.id;
    return typeof id === 'string' && id ? id : undefined;
  } catch {
    return undefined;
  }
}

export function appendActorUserIdToFormData(formData: FormData): void {
  const id = getActorUserIdFromStorage();
  if (id) formData.append('actorUserId', id);
}

/** For DELETE requests: `?actorUserId=...` or empty string. */
export function getActorUserIdQuery(): string {
  const id = getActorUserIdFromStorage();
  return id ? `?actorUserId=${encodeURIComponent(id)}` : '';
}
