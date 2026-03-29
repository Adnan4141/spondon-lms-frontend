/** Course content `fileUrl` pointing at a file stored on this server. */
export function isLocalUploadPath(url: string | undefined | null): boolean {
  return !!url && url.startsWith('/uploads/');
}

export function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveAttachmentUrl(fileUrl: string, apiOrigin: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('/')) return `${apiOrigin}${fileUrl}`;
  return fileUrl;
}
