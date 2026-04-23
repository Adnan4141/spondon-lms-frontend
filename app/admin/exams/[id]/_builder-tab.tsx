'use client';

/**
 * Blueprint builder tab.
 *
 * Left column (lg:col-span-2): section tabs → DifficultyBar, FolderRules Table.
 * Right column: FolderBrowser + Generation settings + ValidationPanel.
 *
 * Uses shadcn primitives only. Calls blueprint validate + generate APIs.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

import {
  generateFromBlueprint,
  getExamBlueprint,
  getExamBundleZipUrl,
  getExamPdfDownloadUrl,
  validateExamBlueprint,
  type BlueprintSection,
  type BlueprintValidationResult,
  type ExamBlueprint,
} from '@/lib/api/exams';
import { generateSetPdf } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';
import type { FolderTreeNode } from '@/lib/api/question-bank';

import { DifficultyBar, type DifficultyDistribution } from './_difficulty-bar';
import { FolderBrowser } from './_folder-browser';
import { ValidationPanel } from './_validation-panel';

// ── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_DIFFICULTY: DifficultyDistribution = { easy: 30, medium: 50, hard: 20 };

const newSection = (
  type: 'MCQ' | 'CQ' | 'SHORT',
  name: string,
): BlueprintSection => ({
  name,
  type,
  questionCount: 10,
  marksPerQuestion: type === 'CQ' ? 15 : 1,
  negativeMarks: type === 'MCQ' ? 0.25 : 0,
  passMarks: 0,
  isMandatory: true,
  difficultyDistribution: { ...DEFAULT_DIFFICULTY },
  folderRules: [],
});

const EMPTY_BLUEPRINT: ExamBlueprint = {
  sections: [newSection('MCQ', 'MCQ Section')],
  settings: {
    totalSets: 1,
    durationMinutes: 30,
    shuffleQuestions: true,
    shuffleOptions: true,
    uniqueSets: true,
    language: 'bn',
    negativeMarking: false,
  },
};

export function BuilderTab({
  exam,
  onExamChange,
}: {
  exam: Exam;
  onExamChange: (e: Exam) => void;
}) {
  const { toast } = useToast();

  const [blueprint, setBlueprint] = useState<ExamBlueprint>(() => ({
    ...EMPTY_BLUEPRINT,
    settings: {
      ...EMPTY_BLUEPRINT.settings,
      durationMinutes: exam.durationMinutes ?? 30,
      totalSets: exam.totalSets ?? 1,
      language: (exam.language as 'bn' | 'en') ?? 'bn',
    },
  }));
  const [activeSection, setActiveSection] = useState(0);
  const [validation, setValidation] = useState<BlueprintValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedSets, setGeneratedSets] = useState<
    { name: string; questionCount: number }[] | null
  >(null);
  const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted blueprint once on mount
  useEffect(() => {
    getExamBlueprint(exam.id).then((res) => {
      if (res.success && res.data) {
        setBlueprint(res.data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.id]);

  // Debounced validation whenever blueprint changes
  useEffect(() => {
    if (validationTimer.current) clearTimeout(validationTimer.current);
    validationTimer.current = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await validateExamBlueprint(exam.id, blueprint);
        if (res.success && res.data) setValidation(res.data);
        else setValidation(null);
      } catch {
        setValidation(null);
      } finally {
        setValidating(false);
      }
    }, 500);
    return () => {
      if (validationTimer.current) clearTimeout(validationTimer.current);
    };
  }, [exam.id, blueprint]);

  // ── Section-level helpers ──
  const updateSection = (idx: number, patch: Partial<BlueprintSection>) =>
    setBlueprint((b) => ({
      ...b,
      sections: b.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));

  const addSection = (type: 'MCQ' | 'CQ' | 'SHORT') => {
    setBlueprint((b) => ({
      ...b,
      sections: [...b.sections, newSection(type, `${type} Section ${b.sections.length + 1}`)],
    }));
    setActiveSection(blueprint.sections.length);
  };

  const removeSection = (idx: number) => {
    if (blueprint.sections.length <= 1) return;
    setBlueprint((b) => ({
      ...b,
      sections: b.sections.filter((_, i) => i !== idx),
    }));
    setActiveSection((a) => Math.max(0, a - 1));
  };

  // ── Folder-rule helpers ──
  const addFolderToActive = (folder: FolderTreeNode) => {
    const section = blueprint.sections[activeSection];
    if (!section) return;
    if (section.folderRules.some((r) => r.folderId === folder.id)) {
      toast({ description: 'Folder already added to this section' });
      return;
    }
    updateSection(activeSection, {
      folderRules: [
        ...section.folderRules,
        {
          folderId: folder.id,
          folderName: folder.name,
          questionCount: Math.max(1, Math.ceil(section.questionCount / (section.folderRules.length + 1))),
          includeDescendants: true,
          selectionMode: 'RANDOM',
        },
      ],
    });
  };

  const updateFolderRule = (
    sectionIdx: number,
    ruleIdx: number,
    patch: Partial<BlueprintSection['folderRules'][number]>,
  ) => {
    const section = blueprint.sections[sectionIdx];
    if (!section) return;
    updateSection(sectionIdx, {
      folderRules: section.folderRules.map((r, i) => (i === ruleIdx ? { ...r, ...patch } : r)),
    });
  };

  const removeFolderRule = (sectionIdx: number, ruleIdx: number) => {
    const section = blueprint.sections[sectionIdx];
    if (!section) return;
    updateSection(sectionIdx, {
      folderRules: section.folderRules.filter((_, i) => i !== ruleIdx),
    });
  };

  // ── Settings helpers ──
  const updateSettings = (patch: Partial<ExamBlueprint['settings']>) =>
    setBlueprint((b) => ({ ...b, settings: { ...b.settings, ...patch } }));

  // ── Generate ──
  const handleGenerate = async () => {
    if (!validation?.valid) {
      toast({ description: 'Fix blueprint errors before generating.' });
      return;
    }
    setGenerating(true);
    setGeneratedSets(null);
    try {
      const res = await generateFromBlueprint(exam.id, blueprint);
      if (res.success && res.data) {
        if (res.data.errors.length > 0) {
          toast({
            description: `Generation failed: ${res.data.errors[0].message}`,
          });
          setValidation(
            (prev) =>
              prev && {
                ...prev,
                valid: false,
                errors: res.data!.errors,
              },
          );
        } else {
          setGeneratedSets(res.data.setsSummary);
          onExamChange({
            ...exam,
            totalSets: res.data.setsSummary.length,
            durationMinutes: blueprint.settings.durationMinutes,
          });
          toast({
            description: `Generated ${res.data.setsSummary.length} set(s) successfully.`,
          });
        }
      } else {
        toast({ description: (res as { message?: string }).message ?? 'Generation failed' });
      }
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : 'Generation failed' });
    } finally {
      setGenerating(false);
    }
  };

  // ── Totals ──
  const totals = useMemo(() => {
    const totalQuestions = blueprint.sections.reduce((s, sec) => s + sec.questionCount, 0);
    const totalMarks = blueprint.sections.reduce(
      (s, sec) => s + sec.questionCount * sec.marksPerQuestion,
      0,
    );
    return { totalQuestions, totalMarks, sections: blueprint.sections.length };
  }, [blueprint]);

  const currentSection = blueprint.sections[activeSection];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="space-y-4 lg:col-span-2">
        {/* Totals */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 py-4">
            <Totals label="Total questions" value={totals.totalQuestions} />
            <Totals label="Total marks" value={totals.totalMarks} />
            <Totals label="Sections" value={totals.sections} />
            <Totals label="Sets" value={blueprint.settings.totalSets} />
          </CardContent>
        </Card>

        {/* Sections */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm">Sections</CardTitle>
                <CardDescription className="text-xs">
                  Each section pulls a specific question type (MCQ / CQ / SHORT).
                </CardDescription>
              </div>
              <div className="flex gap-1">
                {(['MCQ', 'CQ', 'SHORT'] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => addSection(t)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs
              value={String(activeSection)}
              onValueChange={(v) => setActiveSection(Number(v))}
            >
              <TabsList className="flex w-full flex-wrap gap-1">
                {blueprint.sections.map((s, i) => (
                  <TabsTrigger key={i} value={String(i)} className="gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {s.type}
                    </Badge>
                    {s.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {blueprint.sections.map((section, idx) => (
                <TabsContent key={idx} value={String(idx)} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="grid gap-1.5">
                      <Label>Section name</Label>
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Questions</Label>
                      <Input
                        type="number"
                        min={1}
                        value={section.questionCount}
                        onChange={(e) =>
                          updateSection(idx, { questionCount: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Marks / question</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        value={section.marksPerQuestion}
                        onChange={(e) =>
                          updateSection(idx, { marksPerQuestion: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Negative marks</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        value={section.negativeMarks ?? 0}
                        onChange={(e) =>
                          updateSection(idx, { negativeMarks: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Pass marks</Label>
                      <Input
                        type="number"
                        min={0}
                        value={section.passMarks ?? 0}
                        onChange={(e) =>
                          updateSection(idx, { passMarks: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 rounded-md border px-3 py-2">
                      <Label>Mandatory</Label>
                      <Switch
                        checked={section.isMandatory ?? true}
                        onCheckedChange={(v) => updateSection(idx, { isMandatory: v })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Difficulty distribution</Label>
                    <DifficultyBar
                      idPrefix={`section-${idx}`}
                      value={section.difficultyDistribution}
                      onChange={(v) => updateSection(idx, { difficultyDistribution: v })}
                    />
                  </div>

                  {/* Folder rules table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Folder rules</Label>
                      <span className="text-xs text-muted-foreground">
                        Rules total:{' '}
                        {section.folderRules.reduce((a, r) => a + r.questionCount, 0)} /{' '}
                        {section.questionCount}
                      </span>
                    </div>

                    {section.folderRules.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Use the Folder browser on the right to add folders.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Folder</TableHead>
                            <TableHead className="w-24 text-center">Count</TableHead>
                            <TableHead className="w-32 text-center">Selection</TableHead>
                            <TableHead className="w-28 text-center">Descendants</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.folderRules.map((rule, rIdx) => (
                            <TableRow key={rule.folderId}>
                              <TableCell>
                                <span className="text-sm">{rule.folderName ?? rule.folderId}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min={1}
                                  value={rule.questionCount}
                                  onChange={(e) =>
                                    updateFolderRule(idx, rIdx, {
                                      questionCount: Number(e.target.value),
                                    })
                                  }
                                  className="h-8 text-center"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Select
                                  value={rule.selectionMode ?? 'RANDOM'}
                                  onValueChange={(v) =>
                                    updateFolderRule(idx, rIdx, {
                                      selectionMode: v as 'RANDOM' | 'MANUAL',
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="RANDOM">Random</SelectItem>
                                    <SelectItem value="MANUAL">Manual</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={rule.includeDescendants ?? true}
                                  onCheckedChange={(v) =>
                                    updateFolderRule(idx, rIdx, { includeDescendants: v })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFolderRule(idx, rIdx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {blueprint.sections.length > 1 && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive"
                        onClick={() => removeSection(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove section
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {generatedSets && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Generated sets</CardTitle>
              <CardDescription className="text-xs">
                Preview or download the latest papers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {generatedSets.map((s) => (
                  <SetPreviewButton
                    key={s.name}
                    examId={exam.id}
                    name={s.name}
                    questionCount={s.questionCount}
                  />
                ))}
                <Button
                  size="sm"
                  onClick={() => window.open(getExamBundleZipUrl(exam.id), '_blank')}
                >
                  Download all (ZIP)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Right column ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <FolderBrowser
          courseId={exam.courseId}
          title={currentSection ? `Add to "${currentSection.name}"` : 'Folders'}
          onSelect={addFolderToActive}
          requireTypes={currentSection ? [currentSection.type] : undefined}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Generation settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Total sets (any N)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={blueprint.settings.totalSets}
                  onChange={(e) => updateSettings({ totalSets: Math.max(1, Number(e.target.value)) })}
                  className="w-24"
                />
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 6, 8].map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={blueprint.settings.totalSets === n ? 'default' : 'outline'}
                      className="h-7 w-8 p-0 text-xs"
                      onClick={() => updateSettings({ totalSets: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={10}
                value={blueprint.settings.durationMinutes}
                onChange={(e) => updateSettings({ durationMinutes: Number(e.target.value) })}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Language</Label>
              <Select
                value={blueprint.settings.language ?? 'bn'}
                onValueChange={(v) => updateSettings({ language: v as 'bn' | 'en' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">বাংলা (Bengali — ক, খ, গ)</SelectItem>
                  <SelectItem value="en">English (A, B, C)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SwitchRow
              label="Shuffle questions"
              checked={blueprint.settings.shuffleQuestions ?? true}
              onCheckedChange={(v) => updateSettings({ shuffleQuestions: v })}
            />
            <SwitchRow
              label="Shuffle options"
              checked={blueprint.settings.shuffleOptions ?? true}
              onCheckedChange={(v) => updateSettings({ shuffleOptions: v })}
            />
            <SwitchRow
              label="Unique sets (no repeat questions)"
              checked={blueprint.settings.uniqueSets ?? true}
              onCheckedChange={(v) => updateSettings({ uniqueSets: v })}
            />
            <SwitchRow
              label="Negative marking"
              checked={blueprint.settings.negativeMarking ?? false}
              onCheckedChange={(v) => updateSettings({ negativeMarking: v })}
            />

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={generating || !validation?.valid}
              onClick={handleGenerate}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {generating
                ? 'Generating…'
                : `Generate ${blueprint.settings.totalSets} exam set${
                    blueprint.settings.totalSets === 1 ? '' : 's'
                  }`}
            </Button>
            {!validation?.valid && (
              <p className="text-center text-[11px] text-muted-foreground">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Fix validation errors to enable generation.
              </p>
            )}
          </CardContent>
        </Card>

        <ValidationPanel result={validation} checking={validating} />
      </div>
    </div>
  );
}

function Totals({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SetPreviewButton({
  examId,
  name,
  questionCount,
}: {
  examId: string;
  name: string;
  questionCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      // Use the exam-level PDF since per-set-id requires a real setId — let backend
      // resolve by name via regenerate-pdf if needed.
      const res = await generateSetPdf(examId, name);
      if (res.success && res.data?.pdfUrl) {
        window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Set {name} · {questionCount}
    </Button>
  );
}
