'use client';

import { useState, useEffect, useRef } from 'react';
import { getExams } from '@/lib/api/exams';
import {
  getOfflineResults,
  getOnlineMeritList,
  getOfflineMeritList,
  getMultipleExamMeritList,
  createOfflineResult,
  createBulkOfflineResults,
  importOfflineResults,
  approveOfflineResult,
  rejectOfflineResult,
  findStudentByRollNo,
  type CreateOfflineResultInput,
} from '@/lib/api/exam-results';
import type { Exam } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  FileText,
  Upload,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Users,
  Layers,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function ExamResultsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExams().then((r) => {
      if (r.success && r.data) setExams(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-10 text-slate-900 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Results Center</h1>
        <p className="text-slate-500 text-lg font-medium">Review scores, check rankings, and manage student results.</p>
      </div>

      <Tabs defaultValue="approval" className="space-y-8">
        <div className="bg-slate-100/50 p-1.5 rounded-2xl inline-flex w-full lg:w-auto">
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap lg:flex-nowrap gap-1">
            <TabsTrigger value="approval" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all font-semibold">Pending</TabsTrigger>
            <TabsTrigger value="online-merit" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all font-semibold">Online Rankings</TabsTrigger>
            <TabsTrigger value="offline-merit" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all font-semibold">Offline Rankings</TabsTrigger>
            <TabsTrigger value="multiple-merit" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all font-semibold">Combined</TabsTrigger>
            <TabsTrigger value="single" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all font-semibold">Add One</TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all font-semibold">Add Many</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8">
          <TabsContent value="approval" className="outline-none">
            <ApprovalTab exams={exams} loading={loading} toast={toast} />
          </TabsContent>
          <TabsContent value="online-merit" className="outline-none">
            <OnlineMeritTab exams={exams} loading={loading} />
          </TabsContent>
          <TabsContent value="offline-merit" className="outline-none">
            <OfflineMeritTab exams={exams} loading={loading} />
          </TabsContent>
          <TabsContent value="multiple-merit" className="outline-none">
            <MultipleMeritTab exams={exams} loading={loading} />
          </TabsContent>
          <TabsContent value="single" className="outline-none">
            <SingleEntryTab exams={exams} loading={loading} toast={toast} />
          </TabsContent>
          <TabsContent value="bulk" className="outline-none">
            <BulkEntryTab exams={exams} loading={loading} toast={toast} />
          </TabsContent>
        </div>
      </Tabs>
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function ApprovalTab({ exams, loading, toast }: { exams: Exam[]; loading: boolean; toast: ReturnType<typeof useToast>['toast'] }) {
  const [results, setResults] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [examFilter, setExamFilter] = useState('all');

  const load = async () => {
    setLoadingList(true);
    const res = await getOfflineResults(examFilter === 'all' ? undefined : examFilter, 'PENDING');
    if (res.success && res.data) setResults(res.data);
    setLoadingList(false);
  };

  useEffect(() => {
    load();
  }, [examFilter]);

  const handleApprove = async (id: string) => {
    try {
      const res = await approveOfflineResult(id);
      if (res.success) {
        setResults((prev) => prev.filter((r) => r.id !== id));
        toast({ title: 'Approved', description: 'Result is now official', variant: 'success' });
      }
    } catch (e) {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await rejectOfflineResult(id);
      if (res.success) {
        setResults((prev) => prev.filter((r) => r.id !== id));
        toast({ title: 'Removed', description: 'Result has been removed', variant: 'success' });
      }
    } catch (e) {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={examFilter} onValueChange={setExamFilter}>
            <SelectTrigger className="w-[300px] h-11 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-indigo-500">
              <SelectValue placeholder="All Tests" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Tests</SelectItem>
              {exams.filter((e) => e.mode === 'OFFLINE').map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={load} disabled={loadingList}>
            <Loader2 className={cn('h-4 w-4 mr-2', loadingList && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loadingList ? (
          <div className="p-32 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-500" />
            <p className="mt-4 text-slate-500 font-medium tracking-tight">Checking for updates...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">All Clear!</h3>
            <p className="text-slate-500 font-medium">No results waiting for your check.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-900 py-5 pl-8">Roll Number</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Score</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Test Name</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Status</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="font-semibold py-5 pl-8 text-slate-900">{r.rollNo}</TableCell>
                    <TableCell className="py-5 font-medium text-slate-700">{r.obtainedMarks ?? '0'} / {r.totalMarks ?? '100'}</TableCell>
                    <TableCell className="py-5 text-slate-600">{exams.find((e) => e.id === r.examId)?.title ?? 'Test'}</TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 rounded-lg px-3 py-1 font-semibold text-xs uppercase tracking-wider">Pending</Badge>
                    </TableCell>
                    <TableCell className="py-5 text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold transition-all" onClick={() => handleApprove(r.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold transition-all" onClick={() => handleReject(r.id)}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function OnlineMeritTab({ exams, loading }: { exams: Exam[]; loading: boolean }) {
  const [examId, setExamId] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const load = async () => {
    if (!examId) return;
    setLoadingList(true);
    const res = await getOnlineMeritList(examId);
    if (res.success && res.data) setData(res.data);
    setLoadingList(false);
  };

  useEffect(() => {
    if (examId) load();
  }, [examId]);

  const onlineExams = exams.filter((e) => e.mode === 'ONLINE');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="w-[300px] h-11 rounded-xl bg-white border-slate-200 shadow-sm">
            <SelectValue placeholder="Select Online Test" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {onlineExams.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm" onClick={load} disabled={!examId || loadingList}>
          <Loader2 className={cn('h-4 w-4 mr-2', loadingList && 'animate-spin')} />
          Show Results
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {!examId ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Pick a Test</h3>
            <p className="text-slate-500 font-medium">Select an online test to see the rankings.</p>
          </div>
        ) : loadingList ? (
          <div className="p-32 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-500" />
            <p className="mt-4 text-slate-500 font-medium tracking-tight">Loading rankings...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-32 text-center text-slate-500 font-medium">No one has taken this test yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-900 py-5 pl-8 w-24">Rank</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Student Name</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Score</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5 pr-8">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <TableRow key={r.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-2">
                        {i === 0 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">1</div>
                        ) : i === 1 ? (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">2</div>
                        ) : i === 2 ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">3</div>
                        ) : (
                          <span className="w-8 text-center font-bold text-slate-400">{i + 1}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div>
                        <p className="font-bold text-slate-900">{r.student?.fullName ?? 'Unknown Student'}</p>
                        <p className="text-xs text-slate-500 font-medium">{r.student?.mobile}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 font-bold text-indigo-600">
                      {r.obtainedMarks ?? '0'} <span className="text-slate-400 font-medium text-xs ml-1">/ {r.totalMarks ?? '100'}</span>
                    </TableCell>
                    <TableCell className="py-5 pr-8 text-slate-500 text-sm font-medium">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function OfflineMeritTab({ exams, loading }: { exams: Exam[]; loading: boolean }) {
  const [examId, setExamId] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const load = async () => {
    if (!examId) return;
    setLoadingList(true);
    const res = await getOfflineMeritList(examId);
    if (res.success && res.data) setData(res.data);
    setLoadingList(false);
  };

  useEffect(() => {
    if (examId) load();
  }, [examId]);

  const offlineExams = exams.filter((e) => e.mode === 'OFFLINE');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="w-[300px] h-11 rounded-xl bg-white border-slate-200 shadow-sm">
            <SelectValue placeholder="Select Offline Test" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {offlineExams.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white shadow-sm" onClick={load} disabled={!examId || loadingList}>
          <Loader2 className={cn('h-4 w-4 mr-2', loadingList && 'animate-spin')} />
          Show Results
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {!examId ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Pick a Test</h3>
            <p className="text-slate-500 font-medium">Select an offline test to see the rankings.</p>
          </div>
        ) : loadingList ? (
          <div className="p-32 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-500" />
            <p className="mt-4 text-slate-500 font-medium tracking-tight">Loading rankings...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-32 text-center text-slate-500 font-medium">No results found for this test.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-900 py-5 pl-8 w-24">Rank</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Roll Number</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Score</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5 pr-8">Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <TableRow key={r.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-2">
                        {i === 0 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">1</div>
                        ) : i === 1 ? (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">2</div>
                        ) : i === 2 ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">3</div>
                        ) : (
                          <span className="w-8 text-center font-bold text-slate-400">{i + 1}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 font-bold text-slate-900">{r.rollNo}</TableCell>
                    <TableCell className="py-5 font-bold text-indigo-600">
                      {r.obtainedMarks ?? '0'} <span className="text-slate-400 font-medium text-xs ml-1">/ {r.totalMarks ?? '100'}</span>
                    </TableCell>
                    <TableCell className="py-5 pr-8 text-slate-500 text-sm font-medium">{r.subject ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function MultipleMeritTab({ exams, loading }: { exams: Exam[]; loading: boolean }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const load = async () => {
    if (selectedIds.length === 0) return;
    setLoadingList(true);
    const res = await getMultipleExamMeritList(selectedIds);
    if (res.success && res.data) setData(res.data);
    setLoadingList(false);
  };

  const toggleExam = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          Select Tests to Combine
        </h3>
        <div className="flex flex-wrap gap-2">
          {exams.map((e) => {
            const isSelected = selectedIds.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggleExam(e.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all border shadow-sm",
                  isSelected 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-100" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                )}
              >
                {e.title}
              </button>
            );
          })}
        </div>
        {selectedIds.length > 0 && (
          <div className="mt-8">
            <Button 
              onClick={load} 
              disabled={loadingList}
              className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-lg shadow-slate-200"
            >
              {loadingList ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Trophy className="h-5 w-5 mr-2 text-amber-400" />}
              Show Combined Rankings
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {data.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium">Select multiple tests above to see combined results.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-900 py-5 pl-8 w-24">Rank</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Student / Roll</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5">Average Score</TableHead>
                  <TableHead className="font-bold text-slate-900 py-5 pr-8">Tests Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <TableRow key={r.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <span className="font-bold text-slate-900">{r.meritPosition ?? i + 1}</span>
                    </TableCell>
                    <TableCell className="py-5 font-semibold text-slate-700">
                      {r.details?.[0]?.student?.fullName ?? r.details?.[0]?.rollNo ?? (r.id?.startsWith('roll:') ? r.id.replace('roll:', '') : r.id)}
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600">{r.avgScore?.toFixed(1) ?? '0'}</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (r.avgScore || 0))}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 pr-8">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 rounded-lg">{r.examCount ?? 0} Tests</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function SingleEntryTab({ exams, loading, toast }: { exams: Exam[]; loading: boolean; toast: ReturnType<typeof useToast>['toast'] }) {
  const [examId, setExamId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [obtainedMarks, setObtainedMarks] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [subject, setSubject] = useState('');
  const [student, setStudent] = useState<{ fullName: string; mobile: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!rollNo.trim()) return;
    const res = await findStudentByRollNo(rollNo.trim());
    setStudent(res.success && res.data ? res.data : null);
  };

  const handleSave = async () => {
    if (!examId || !rollNo.trim()) {
      toast({ title: 'Required', description: 'Please pick a test and enter roll number', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await createOfflineResult({
        examId,
        rollNo: rollNo.trim(),
        obtainedMarks: obtainedMarks ? Number(obtainedMarks) : undefined,
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
        subject: subject || undefined,
      });
      if (res.success) {
        toast({ title: 'Saved!', description: 'Student score added successfully.', variant: 'success' });
        setObtainedMarks('');
        setTotalMarks('');
        setSubject('');
      }
    } catch (e) {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const offlineExams = exams.filter((e) => e.mode === 'OFFLINE');

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30">
          <h3 className="text-xl font-bold text-slate-900">Add Student Score</h3>
          <p className="text-slate-500 font-medium">Enter details for a single student result.</p>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Select Test</label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500">
                  <SelectValue placeholder="Pick a test" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {offlineExams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Student Roll Number</label>
              <div className="relative">
                <Input
                  placeholder="e.g. 101010"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  onBlur={handleSearch}
                  className="h-12 rounded-xl border-slate-200 pr-12 focus:ring-indigo-500"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              {student && (
                <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> {student.fullName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Score Obtained</label>
              <Input 
                type="number" 
                placeholder="0" 
                value={obtainedMarks} 
                onChange={(e) => setObtainedMarks(e.target.value)} 
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Max Score</label>
              <Input 
                type="number" 
                placeholder="100" 
                value={totalMarks} 
                onChange={(e) => setTotalMarks(e.target.value)} 
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Subject (Optional)</label>
              <Input 
                placeholder="e.g. Math" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={submitting}
              className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-100"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              Save Result
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkEntryTab({ exams, loading, toast }: { exams: Exam[]; loading: boolean; toast: ReturnType<typeof useToast>['toast'] }) {
  const [examId, setExamId] = useState('');
  const [rows, setRows] = useState<{ rollNo: string; obtainedMarks: string; totalMarks: string }[]>([]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRow = () => setRows((prev) => [...prev, { rollNo: '', obtainedMarks: '', totalMarks: '' }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !examId) return;
    setLoadingExcel(true);
    try {
      const res = await importOfflineResults(examId, file);
      if (res.success) {
        toast({ title: 'Success', description: `Uploaded ${res.data?.count ?? 0} results`, variant: 'success' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoadingExcel(false);
      e.target.value = '';
    }
  };

  const handleBulkSave = async () => {
    if (!examId) {
      toast({ title: 'Required', description: 'Select a test first', variant: 'destructive' });
      return;
    }
    const items: CreateOfflineResultInput[] = rows
      .filter((r) => r.rollNo.trim())
      .map((r) => ({
        examId,
        rollNo: r.rollNo.trim(),
        obtainedMarks: r.obtainedMarks ? Number(r.obtainedMarks) : undefined,
        totalMarks: r.totalMarks ? Number(r.totalMarks) : undefined,
      }));
    if (items.length === 0) {
      toast({ title: 'Required', description: 'Enter at least one roll number', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await createBulkOfflineResults(items);
      if (res.success) {
        toast({ title: 'Saved!', description: `Saved ${res.data?.count ?? 0} scores.`, variant: 'success' });
        setRows([]);
      }
    } catch (e) {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const offlineExams = exams.filter((e) => e.mode === 'OFFLINE');

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Select Test</label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="w-[300px] h-12 rounded-xl border-slate-200 focus:ring-indigo-500">
              <SelectValue placeholder="Pick a test" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {offlineExams.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelUpload}
            ref={fileInputRef}
          />
          <Button 
            variant="outline" 
            disabled={!examId || loadingExcel} 
            onClick={() => fileInputRef.current?.click()}
            className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold transition-all shadow-sm"
          >
            {loadingExcel ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2 text-indigo-500" />}
            Upload Excel File
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Type Marks Manually</h3>
            <p className="text-sm text-slate-500 font-medium">Add multiple students one by one.</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={addRow}
            className="rounded-lg border-slate-200 font-bold"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-900 py-4 pl-6">Roll Number</TableHead>
                <TableHead className="font-bold text-slate-900 py-4">Score</TableHead>
                <TableHead className="font-bold text-slate-900 py-4">Max Score</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} className="border-slate-50 hover:bg-slate-50/30">
                  <TableCell className="py-3 pl-6">
                    <Input
                      placeholder="e.g. 101010"
                      value={r.rollNo}
                      onChange={(e) => updateRow(i, 'rollNo', e.target.value)}
                      className="h-10 rounded-lg border-slate-200 focus:ring-indigo-500"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <Input
                      type="number"
                      placeholder="0"
                      value={r.obtainedMarks}
                      onChange={(e) => updateRow(i, 'obtainedMarks', e.target.value)}
                      className="h-10 rounded-lg border-slate-200 focus:ring-indigo-500"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <Input
                      type="number"
                      placeholder="100"
                      value={r.totalMarks}
                      onChange={(e) => updateRow(i, 'totalMarks', e.target.value)}
                      className="h-10 rounded-lg border-slate-200 focus:ring-indigo-500"
                    />
                  </TableCell>
                  <TableCell className="py-3 pr-6 text-right">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold" 
                      onClick={() => removeRow(i)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    No rows added. Click "Add Row" to start typing.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end">
          <Button 
            onClick={handleBulkSave} 
            disabled={submitting || rows.length === 0}
            className="h-12 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-lg"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Save All Scores
          </Button>
        </div>
      </div>
    </div>
  );
}
