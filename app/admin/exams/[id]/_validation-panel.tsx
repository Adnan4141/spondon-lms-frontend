'use client';

/**
 * Validation panel — shows the live results from `/blueprint/validate`.
 * Pure shadcn: Card, Badge, scroll list.
 */

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { BlueprintValidationResult } from '@/lib/api/exams';

export function ValidationPanel({
  result,
  checking,
}: {
  result: BlueprintValidationResult | null;
  checking: boolean;
}) {
  if (!result && !checking) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Validation</CardTitle>
          <CardDescription className="text-xs">
            Save a valid blueprint to run checks.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const isValid = result?.valid ?? false;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              {isValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              {checking ? 'Validating…' : isValid ? 'Blueprint valid' : 'Fix blueprint errors'}
            </CardTitle>
            <CardDescription className="text-xs">
              {errors.length} error{errors.length === 1 ? '' : 's'} ·{' '}
              {warnings.length} warning{warnings.length === 1 ? '' : 's'}
            </CardDescription>
          </div>
          <Badge variant={isValid ? 'default' : 'destructive'}>
            {isValid ? 'OK' : 'Invalid'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {errors.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-xs font-medium text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Errors
            </p>
            <ul className="space-y-1">
              {errors.map((e, i) => (
                <li
                  key={`${e.field}-${i}`}
                  className="rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1.5 text-xs"
                >
                  <span className="font-medium">{e.field}:</span> {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Warnings
            </p>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li
                  key={i}
                  className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900"
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result?.availability && result.availability.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Availability
            </p>
            <ul className="space-y-1">
              {result.availability.map((a) =>
                a.folderRules.map((r) => (
                  <li
                    key={`${a.sectionName}-${r.folderId}`}
                    className="rounded-md border bg-background px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium">{a.sectionName}</span> → {r.folderName || r.folderId}:{' '}
                    <span className="tabular-nums">
                      {r.available}
                    </span>{' '}
                    of {a.type} available (need {r.neededForAllSets} for all sets)
                  </li>
                )),
              )}
            </ul>
          </div>
        )}

        {isValid && errors.length === 0 && warnings.length === 0 && (
          <p className="text-xs text-muted-foreground">
            All checks pass. Ready to generate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
