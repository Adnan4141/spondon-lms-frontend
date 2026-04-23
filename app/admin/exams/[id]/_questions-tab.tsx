'use client';

/**
 * Question-bank browser tab.
 *
 * Left: scrollable folder tree (selectable). Right: filters + stat cards +
 * question list (each question in a shadcn Card; MCQ options rendered in 2-col
 * grid, CQ sub-parts expanded, passage-block headers rendered with blockquote
 * styling).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  NotebookPen,
  FileQuestion,
  Hash,
  ListChecks,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getQuestionFolderTree,
  getQuestionFolderDescendants,
  getQuestions,
  getPassages,
  type FolderTreeNode,
} from '@/lib/api/question-bank';
import { getActorUserIdFromStorage } from '@/lib/actor-user';
import type { Exam } from '@/types/exam';
import type { McqPassage, Question } from '@/types/question';

export function QuestionsTab({ exam }: { exam: Exam }) {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeNode | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  // Load folder tree
  useEffect(() => {
    const teacherUserId = getActorUserIdFromStorage();
    const attempts: Array<{ courseId?: string; teacherUserId?: string }> = [
      { courseId: exam.courseId, teacherUserId },
      { teacherUserId },
      { courseId: exam.courseId },
      {},
    ];

    let cancelled = false;
    const run = async () => {
      for (const attempt of attempts) {
        const r = await getQuestionFolderTree(attempt.courseId, attempt.teacherUserId);
        if (!r.success) continue;
        if ((r.data?.length ?? 0) === 0) continue;
        if (cancelled) return;
        setTree(r.data ?? []);
        const first = findFirstLeaf(r.data ?? []);
        if (first) setSelectedFolder(first);
        return;
      }
      if (!cancelled) {
        setTree([]);
        setSelectedFolder(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [exam.courseId]);

  // Load questions and passages when folder changes
  useEffect(() => {
    if (!selectedFolder) return;
    setLoading(true);
    getQuestionFolderDescendants(selectedFolder.id)
      .then(async (dRes) => {
        const folderIds =
          dRes.success && dRes.data?.folderIds?.length
            ? dRes.data.folderIds
            : [selectedFolder.id];
        const [qRes, pRes] = await Promise.all([
          getQuestions(undefined, undefined, undefined, undefined, undefined, undefined, undefined, folderIds),
          getPassages(undefined, folderIds),
        ]);
        if (qRes.success && qRes.data) setQuestions(qRes.data);
        if (pRes.success && pRes.data) setPassages(pRes.data);
      })
      .finally(() => setLoading(false));
  }, [selectedFolder]);

  // Compute year filter options
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const q of questions) if (q.year) set.add(q.year);
    for (const p of passages) if (p.year) set.add(p.year);
    return [...set].sort((a, b) => b - a);
  }, [questions, passages]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (typeFilter !== 'ALL' && q.type !== typeFilter) return false;
      if (
        difficultyFilter !== 'ALL' &&
        (q.difficulty ?? '') !== difficultyFilter
      )
        return false;
      if (yearFilter !== 'ALL' && String(q.year ?? '') !== yearFilter)
        return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        if (!q.prompt.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [questions, search, typeFilter, difficultyFilter, yearFilter]);

  const stats = useMemo(() => {
    const out = { total: 0, mcq: 0, cq: 0, passage: passages.length };
    for (const q of questions) {
      out.total += 1;
      if (q.type === 'MCQ') out.mcq += 1;
      if (q.type === 'CQ') out.cq += 1;
    }
    return out;
  }, [questions, passages]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Folder sidebar */}
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[560px] space-y-0.5 overflow-y-auto rounded-md border bg-background p-1">
            {tree.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No folders yet.</p>
            ) : (
              tree.map((n) => (
                <FolderRow
                  key={n.id}
                  node={n}
                  depth={0}
                  selectedId={selectedFolder?.id ?? null}
                  expanded={expanded}
                  onToggle={(id) =>
                    setExpanded((e) => ({ ...e, [id]: !e[id] }))
                  }
                  onSelect={setSelectedFolder}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main pane */}
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr]">
              <Input
                placeholder="Search questions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="CQ">CQ</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={difficultyFilter}
                onValueChange={setDifficultyFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All difficulties</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill icon={Hash} label="Total" value={stats.total} />
          <StatPill icon={ListChecks} label="MCQ" value={stats.mcq} />
          <StatPill icon={NotebookPen} label="CQ" value={stats.cq} />
          <StatPill icon={FileQuestion} label="Passages" value={stats.passage} />
        </div>

        {/* List */}
        {loading ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Loading questions…
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              {selectedFolder
                ? 'No questions match the filters.'
                : 'Select a folder to list its questions.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Folder row (recursive) ────────────────────────────────────────────────
function FolderRow({
  node,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: FolderTreeNode;
  depth: number;
  selectedId: string | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (n: FolderTreeNode) => void;
}) {
  const isOpen = expanded[node.id] ?? depth < 1;
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 ${
          isSelected ? 'bg-muted' : ''
        }`}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => onToggle(node.id)}
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(node)}
          className="h-auto flex-1 justify-start truncate px-0 py-0 text-left text-sm font-normal"
        >
          {node.name}
        </Button>
        <Badge variant="outline" className="text-[10px]">
          {node.counts.total}
        </Badge>
      </div>
      {isOpen &&
        hasChildren &&
        node.children.map((c) => (
          <FolderRow
            key={c.id}
            node={c}
            depth={depth + 1}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function findFirstLeaf(tree: FolderTreeNode[]): FolderTreeNode | null {
  for (const n of tree) {
    if (n.counts.total > 0) return n;
    const child = findFirstLeaf(n.children);
    if (child) return child;
  }
  return tree[0] ?? null;
}

// ── Stat pill ──────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-base font-semibold leading-none">{value}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Question card ──────────────────────────────────────────────────────────
const DIFF_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  EASY: 'secondary',
  MEDIUM: 'default',
  HARD: 'destructive',
};

function QuestionCard({ q }: { q: Question }) {
  const [expanded, setExpanded] = useState(false);
  const subParts = Array.isArray((q.meta as { subParts?: unknown })?.subParts)
    ? ((q.meta as { subParts: Array<{ label: string; prompt: string; marks?: number; answerGuide?: string }> })
        .subParts)
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{q.type}</Badge>
            {q.mcqType === 'PASSAGE_CHILD' && (
              <Badge variant="secondary">Passage child</Badge>
            )}
            {q.difficulty && (
              <Badge variant={DIFF_VARIANT[q.difficulty] ?? 'outline'}>
                {q.difficulty}
              </Badge>
            )}
            {q.year && <Badge variant="outline">{q.year}</Badge>}
            {q.tags?.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline">
                #{t}
              </Badge>
            ))}
          </div>
          {(q.type === 'CQ' && subParts) || q.passage ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {q.passage && (
          <div className="rounded-md border-l-4 border-amber-400 bg-amber-50/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold">Passage:</span>{' '}
            {q.passage.title ?? q.passage.content.slice(0, 140)}
          </div>
        )}

        <p
          className="whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: q.prompt }}
        />

        {q.type === 'MCQ' && q.options && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options.map((o) => (
              <div
                key={o.id}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                  o.isCorrect ? 'border-emerald-400 bg-emerald-50' : ''
                }`}
              >
                <span className="font-semibold">{o.label}.</span>
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{ __html: o.text }}
                />
                {o.isCorrect && (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {q.type === 'CQ' && subParts && expanded && (
          <div className="space-y-2">
            {subParts.map((sp) => (
              <div key={sp.label} className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">({sp.label})</span>
                  {typeof sp.marks === 'number' && (
                    <Badge variant="outline">{sp.marks} marks</Badge>
                  )}
                </div>
                <p
                  className="mt-1 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: sp.prompt }}
                />
                {sp.answerGuide && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    <span className="font-medium">Answer:</span> {sp.answerGuide}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {q.passage && expanded && (
          <div className="rounded-md border bg-background px-3 py-2 text-xs">
            <p
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: q.passage.content }}
            />
          </div>
        )}

        {q.explanation && (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs">
            <span className="font-semibold">Explanation:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: q.explanation }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
