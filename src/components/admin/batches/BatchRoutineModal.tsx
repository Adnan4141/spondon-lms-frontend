'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getRoutineSlots,
  getRoutineExportPdfUrl,
  getRoutineExportExcelUrl,
  type RoutineSlot,
} from '@/lib/api/routine';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toYmd(d?: Date): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = {
  batchId: string;
  batchName: string;
  courseName?: string;
  branchId?: string;
};

export function BatchRoutineModal({ batchId, batchName, courseName, branchId }: Props) {
  const { toast } = useToast();
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfStart, setPdfStart] = useState<Date | undefined>(undefined);
  const [pdfEnd, setPdfEnd] = useState<Date | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRoutineSlots({ batchId, branchId: branchId || undefined });
      if (res.success && res.data) setSlots(res.data);
      else setSlots([]);
    } catch {
      toast({ title: 'Error', description: 'Failed to load routine slots', variant: 'destructive' });
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [batchId, branchId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...slots].sort((a, b) =>
        a.dayOfWeek !== b.dayOfWeek
          ? a.dayOfWeek - b.dayOfWeek
          : a.startTime.localeCompare(b.startTime),
      ),
    [slots],
  );

  const exportPdfListUrl = getRoutineExportPdfUrl({
    batchId,
    branchId: branchId || undefined,
    format: 'list',
  });

  const exportExcelTemplateUrl = getRoutineExportExcelUrl({
    batchId,
    branchId: branchId || undefined,
    format: 'template',
  });

  const openWeeklyPdf = () => {
    const s = toYmd(pdfStart);
    const e = toYmd(pdfEnd);
    if (!s || !e) {
      toast({ title: 'Dates required', description: 'Pick start and end dates for the weekly PDF.', variant: 'destructive' });
      return;
    }
    const url = getRoutineExportPdfUrl({
      batchId,
      branchId: branchId || undefined,
      format: 'weekly-range',
      startDate: s,
      endDate: e,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="flex max-h-[min(85vh,720px)] flex-col gap-4 text-slate-900">
      <div className="shrink-0 space-y-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly template</p>
            <h3 className="text-lg font-bold tracking-tight">{batchName}</h3>
            {courseName && <p className="text-sm text-muted-foreground">{courseName}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="secondary">{sorted.length} slot{sorted.length !== 1 ? 's' : ''}</Badge>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(exportPdfListUrl, '_blank')}>
            <Download className="h-3.5 w-3.5" />
            PDF list
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(exportExcelTemplateUrl, '_blank')}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="slots" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="slots">All slots</TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5">
            <CalendarRange className="h-3.5 w-3.5" />
            PDF by range
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slots" className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
              Loading slots…
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No routine slots are linked to this batch yet. Add them from{' '}
              <span className="font-semibold text-slate-700">Admin → Routine</span>.
            </div>
          ) : (
            <div className="max-h-[380px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow>
                    <TableHead className="font-bold">Day</TableHead>
                    <TableHead className="font-bold">Time</TableHead>
                    <TableHead className="font-bold">Topic</TableHead>
                    <TableHead className="font-bold">Teacher</TableHead>
                    <TableHead className="font-bold">Mode</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">{DAY_NAMES[slot.dayOfWeek] ?? slot.dayOfWeek}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {slot.startTime}–{slot.endTime}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-muted-foreground">{slot.topic ?? '—'}</TableCell>
                      <TableCell>{slot.teacher?.fullName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={slot.mode === 'ONLINE' ? 'secondary' : 'outline'} className="text-[10px]">
                          {slot.mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={slot.isActive ? 'default' : 'destructive'} className="text-[10px]">
                          {slot.isActive ? 'Active' : 'Off'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-sm text-muted-foreground">
            Export a weekly timetable PDF for this batch across a date range (same engine as Routine → Generated).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Start date</Label>
              <DatePicker date={pdfStart} setDate={setPdfStart} placeholder="Pick start" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">End date</Label>
              <DatePicker date={pdfEnd} setDate={setPdfEnd} placeholder="Pick end" />
            </div>
          </div>
          <Button className="gap-2" onClick={openWeeklyPdf}>
            <Download className="h-4 w-4" />
            Download weekly grid PDF
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
