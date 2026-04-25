'use client';

import { useEffect, useState } from 'react';
import { getOmrSample } from '@/lib/api/exams';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OmrSheetPreviewProps {
  examId: string;
}

export function OmrSheetPreview({ examId }: OmrSheetPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState(0);
  const [opts, setOpts] = useState(4);
  const [labels, setLabels] = useState<string[]>(['A', 'B', 'C', 'D']);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await getOmrSample(examId);
        if (cancelled) return;
        if (res.success && res.data) {
          setQ(res.data.questionCount);
          setOpts(res.data.optionCount);
          setLabels(res.data.labels);
        } else {
          setErr(res.message || 'Could not load OMR layout');
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (err) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</p>;
  }

  const rowH = 28;
  const colW = 36;
  const margin = 48;
  const labelW = 36;
  const width = margin + labelW + opts * colW + margin;
  const height = margin + 32 + q * rowH + margin;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Printable stub: <strong>{q}</strong> questions × <strong>{opts}</strong> options ({labels.join(', ')})
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 print:border-0 print:p-0">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto print:max-w-none"
          aria-label="OMR sheet preview"
        >
          <rect width="100%" height="100%" fill="#fff" stroke="#e2e8f0" />
          <text x={width / 2} y={margin - 8} textAnchor="middle" fill="#0f172a" fontSize={13} fontWeight={700}>
            OMR answer sheet (preview)
          </text>
          {Array.from({ length: q }, (_, i) => {
            const y = margin + 32 + i * rowH;
            return (
              <g key={i}>
                <text x={margin + 8} y={y - 6} fill="#475569" fontSize={11} fontFamily="ui-monospace, monospace">
                  {i + 1}
                </text>
                {labels.map((_, j) => {
                  const cx = margin + labelW + j * colW + colW / 2;
                  const cy = y - 10;
                  return (
                    <circle
                      key={j}
                      cx={cx}
                      cy={cy}
                      r={9}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth={1.2}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
