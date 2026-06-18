import type { QuestionFolder } from '@/types/question';

export function getFolderById(folders: QuestionFolder[], id?: string) {
  return id ? folders.find((f) => f.id === id) : undefined;
}

export function getFolderBreadcrumbs(
  folders: QuestionFolder[],
  activeFolderId?: string,
): QuestionFolder[] {
  const crumbs: QuestionFolder[] = [];
  let currentId = activeFolderId;
  while (currentId) {
    const folder = folders.find((f) => f.id === currentId);
    if (folder) {
      crumbs.unshift(folder);
      currentId = folder.parentFolderId ?? undefined;
    } else {
      break;
    }
  }
  return crumbs;
}

export function getCurrentSubfolders(
  folders: QuestionFolder[],
  activeFolderId?: string,
): QuestionFolder[] {
  return folders.filter((f) =>
    activeFolderId ? f.parentFolderId === activeFolderId : !f.parentFolderId,
  );
}

export function getDescendantFolderLevels(
  folders: QuestionFolder[],
  rootId?: string,
): QuestionFolder[][] {
  const roots = rootId ? [rootId] : folders.filter((f) => !f.parentFolderId).map((f) => f.id);
  const levels: QuestionFolder[][] = [];
  let queue = roots.map((id) => ({ id, level: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const next: Array<{ id: string; level: number }> = [];
    queue.forEach(({ id, level }) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = getFolderById(folders, id);
      if (!node) return;
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      folders
        .filter((f) => f.parentFolderId === id)
        .forEach((child) => next.push({ id: child.id, level: level + 1 }));
    });
    queue = next;
  }

  return levels;
}
