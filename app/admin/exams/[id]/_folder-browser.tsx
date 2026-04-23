'use client';

/**
 * Recursive folder tree picker. Fetches the folder tree once and renders an
 * expandable shadcn Card with:
 *   - Input search
 *   - Indented rows with expand/collapse toggles
 *   - A primary action button per row (e.g. "Add") handled by the parent
 *
 * Kept entirely shadcn-styled; no raw buttons/inputs.
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Search } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { getQuestionFolderTree, type FolderTreeNode } from '@/lib/api/question-bank';
import { getActorUserIdFromStorage } from '@/lib/actor-user';

interface FolderBrowserProps {
  courseId?: string;
  title?: string;
  onSelect: (folder: FolderTreeNode) => void;
  /** Optional filter to hide folders that don't have questions of these types */
  requireTypes?: Array<'MCQ' | 'CQ' | 'SHORT'>;
}

export function FolderBrowser({
  courseId,
  title = 'Question folders',
  onSelect,
  requireTypes,
}: FolderBrowserProps) {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const teacherUserId = getActorUserIdFromStorage();

    const run = async () => {
      setLoading(true);
      setLoadError(null);

      // Try combinations in order: scoped+teacher, all+teacher, scoped, all.
      const attempts: Array<{ courseId?: string; teacherUserId?: string }> = [
        { courseId, teacherUserId },
        { teacherUserId },
        { courseId },
        {},
      ];

      for (const attempt of attempts) {
        const res = await getQuestionFolderTree(attempt.courseId, attempt.teacherUserId);
        if (!res.success) continue;
        if (cancelled) return;
        if ((res.data?.length ?? 0) > 0) {
          setTree(res.data ?? []);
          setLoading(false);
          return;
        }
      }

      if (!cancelled) {
        setTree([]);
        setLoadError('No folders returned from API for current scope.');
        setLoading(false);
      }
    };

    run().catch((err) => {
      if (!cancelled) {
        setTree([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load folders');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const aggregateCountsById = useMemo(() => {
    const out = new Map<
      string,
      { mcqSingle: number; mcqPassage: number; cq: number; short: number; total: number }
    >();

    const walk = (n: FolderTreeNode) => {
      let agg = { ...n.counts };
      for (const c of n.children) {
        const childAgg = walk(c);
        agg = {
          mcqSingle: agg.mcqSingle + childAgg.mcqSingle,
          mcqPassage: agg.mcqPassage + childAgg.mcqPassage,
          cq: agg.cq + childAgg.cq,
          short: agg.short + childAgg.short,
          total: agg.total + childAgg.total,
        };
      }
      out.set(n.id, agg);
      return agg;
    };

    for (const root of tree) walk(root);
    return out;
  }, [tree]);

  const matches = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    const out = new Set<string>();
    const walk = (nodes: FolderTreeNode[], ancestors: string[]) => {
      for (const n of nodes) {
        const hit = n.name.toLowerCase().includes(q);
        if (hit) {
          out.add(n.id);
          for (const a of ancestors) out.add(a);
        }
        walk(n.children, [...ancestors, n.id]);
      }
    };
    walk(tree, []);
    return out;
  }, [tree, search]);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const hasType = (n: FolderTreeNode): boolean => {
    if (!requireTypes || requireTypes.length === 0) return true;
    const c = aggregateCountsById.get(n.id) ?? n.counts;
    for (const t of requireTypes) {
      if (t === 'MCQ' && c.mcqSingle + c.mcqPassage > 0) return true;
      if (t === 'CQ' && c.cq > 0) return true;
      if (t === 'SHORT' && c.short > 0) return true;
    }
    return false;
  };

  const renderNode = (n: FolderTreeNode, depth: number): React.ReactNode => {
    if (matches && !matches.has(n.id)) return null;
    const show = hasType(n);
    if (requireTypes?.length && !show) return null;
    const isOpen = expanded[n.id] ?? (matches ? true : depth < 1);
    const hasChildren = n.children.length > 0;
    const aggregate = aggregateCountsById.get(n.id) ?? n.counts;

    return (
      <div key={n.id}>
        <div
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
          style={{ paddingLeft: 8 + depth * 16 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => toggle(n.id)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            ) : (
              <span className="inline-block h-3.5 w-3.5" />
            )}
          </Button>
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="flex-1 truncate text-sm">{n.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {aggregate.total}
          </Badge>
          {show && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => onSelect(n)}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          )}
        </div>
        {isOpen &&
          hasChildren &&
          n.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders…"
            className="pl-9"
          />
        </div>
        <div className="max-h-[420px] space-y-0.5 overflow-y-auto rounded-md border bg-background p-1">
          {loading ? (
            <p className="p-3 text-xs text-muted-foreground">Loading folders…</p>
          ) : loadError ? (
            <p className="p-3 text-xs text-destructive">{loadError}</p>
          ) : tree.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No folders found.</p>
          ) : (
            tree.map((n) => renderNode(n, 0))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
