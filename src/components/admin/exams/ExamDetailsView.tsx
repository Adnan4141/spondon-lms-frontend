'use client';

import { Exam } from '@/types/exam';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Activity,
  User,
  History,
  Info,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  FileText,
  Download,
  Upload,
  Image,
  FileSpreadsheet,
  XCircle,
  Trophy
} from 'lucide-react';
import { getExamById, regenerateExamPdf, regenerateSolveSheet, getExamPdfDownloadUrl } from '@/lib/api/exams';
import { getOmrScans, uploadOmrScan, getOmrScanDownloadUrl, importOfflineResults, getOfflineResults, approveOfflineResult, rejectOfflineResult, type OmrScan } from '@/lib/api/exam-results';
import { useState, useEffect } from 'react';
import { ExamQuestionBuilder } from './ExamQuestionBuilder';
import { ExamLeaderboard } from './ExamLeaderboard';

interface ExamDetailsViewProps {
  exam: Exam;
}

function getStatusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'CLOSED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export function ExamDetailsView({ exam: initialExam }: ExamDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'leaderboard'>('info');
  const [exam, setExam] = useState(initialExam);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solveSheetLoading, setSolveSheetLoading] = useState(false);
  const [omrScans, setOmrScans] = useState<OmrScan[]>([]);
  const [omrUploading, setOmrUploading] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const [offlineResults, setOfflineResults] = useState<any[]>([]);

  const fetchExamData = async () => {
    const res = await getExamById(exam.id);
    if (res.success && res.data) setExam(res.data);
  };

  const fetchOmrScans = async () => {
    const res = await getOmrScans(exam.id);
    if (res.success && res.data) setOmrScans(res.data);
  };

  useEffect(() => {
    if (exam.mode === 'OFFLINE') {
      fetchOmrScans();
      getOfflineResults(exam.id).then((r) => r.success && r.data && setOfflineResults(r.data));
    }
  }, [exam.id, exam.mode]);

  const handleApproveResult = async (id: string) => {
    try {
      const res = await approveOfflineResult(id);
      if (res.success) setOfflineResults((prev) => prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'APPROVED' } : r)));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRejectResult = async (id: string) => {
    try {
      const res = await rejectOfflineResult(id);
      if (res.success) setOfflineResults((prev) => prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'REJECTED' } : r)));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleOmrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOmrUploading(true);
    try {
      const res = await uploadOmrScan(exam.id, file);
      if (res.success && res.data) setOmrScans((prev) => [res.data!, ...prev]);
    } finally {
      setOmrUploading(false);
      e.target.value = '';
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelImporting(true);
    try {
      const res = await importOfflineResults(exam.id, file);
      if (res.success && res.data) {
        alert(`Imported ${res.data.count} results successfully.`);
      }
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setExcelImporting(false);
      e.target.value = '';
    }
  };

  const handleRegeneratePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await regenerateExamPdf(exam.id);
      if (res.success && res.data?.pdfUrl) {
        setExam((prev) => ({ ...prev, pdfUrl: res.data!.pdfUrl }));
        window.open(getExamPdfDownloadUrl(res.data!.pdfUrl), '_blank');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRegenerateSolveSheet = async () => {
    setSolveSheetLoading(true);
    try {
      const res = await regenerateSolveSheet(exam.id);
      if (res.success && res.data?.solveSheetUrl) {
        setExam((prev) => ({ ...prev, solveSheetUrl: res.data!.solveSheetUrl }));
        window.open(getExamPdfDownloadUrl(res.data!.solveSheetUrl), '_blank');
      }
    } finally {
      setSolveSheetLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white text-slate-900">
      {/* Navigation Header */}
      <div className="px-8 pt-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
         <div className="flex gap-8">
            {[
              { id: 'info', label: 'Exam Info', icon: Info },
              { id: 'questions', label: 'Questions', icon: FileSearch },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2",
                  activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.4)]" />}
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {activeTab === 'info' ? (
          <div className="animate-in fade-in duration-500">
            {/* Header Hero Card */}
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
               <div className="absolute top-0 right-0 p-6">
                  <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest", getStatusBadgeClass(exam.status))}>
                    {exam.status}
                  </Badge>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                        <Activity className="h-6 w-6" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Assessment Unit</span>
                        <span className="text-[10px] font-bold text-slate-400">ID: {exam.id.slice(0, 12)}...</span>
                     </div>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight max-w-2xl">{exam.title}</h2>
                  
                  <div className="flex flex-wrap gap-6 pt-2">
                     <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                        {exam.course?.name}
                     </div>
                     <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                        <MapPin className="h-4 w-4 text-rose-500" />
                        {exam.branch?.name}
                     </div>
                     {exam.batch && (
                       <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                          <Layers className="h-4 w-4 text-amber-500" />
                          {exam.batch.name}
                       </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Configuration Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
               {[
                 { label: 'Exam Mode', value: exam.mode, icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: 'Attempts', value: exam._count?.attempts || 0, icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { label: 'Duration', value: exam.durationMinutes ? `${exam.durationMinutes}m` : '∞', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' },
                 { label: 'Type', value: exam.type, icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
               ].map((stat, i) => (
                 <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                       <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-base font-black text-slate-900">{stat.value}</p>
                 </div>
               ))}
            </div>

            {/* Detailed Sections */}
            <div className="grid gap-10 lg:grid-cols-2">
               <div className="space-y-8">
                  <div>
                     <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                        <Calendar className="h-4 w-4" />
                        Access Timeline
                     </h3>
                     <div className="grid gap-4">
                        <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                           <span className="text-base font-bold text-slate-500 uppercase tracking-wider">Window Opens</span>
                           <span className="text-base font-black text-slate-900">
                             {exam.startAt ? new Date(exam.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Immediate Access'}
                           </span>
                        </div>
                        <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                           <span className="text-base font-bold text-slate-500 uppercase tracking-wider">Window Closes</span>
                           <span className="text-base font-black text-slate-900">
                             {exam.endAt ? new Date(exam.endAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Permanent'}
                           </span>
                        </div>
                     </div>
                  </div>

                  {exam.mode === 'OFFLINE' && (
                    <div>
                       <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 mb-4">
                          <Image className="h-4 w-4" />
                          OMR Scans
                       </h3>
                           <div className="flex flex-wrap gap-3 mb-4">
                             <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 cursor-pointer disabled:opacity-50">
                               <Upload className="h-4 w-4" />
                               {omrUploading ? 'Uploading...' : 'Upload OMR Scan'}
                               <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOmrUpload} disabled={omrUploading} />
                             </label>
                             <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-sm font-bold text-emerald-700 cursor-pointer disabled:opacity-50">
                               <FileSpreadsheet className="h-4 w-4" />
                               {excelImporting ? 'Importing...' : 'Import Excel Results'}
                               <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} disabled={excelImporting} />
                             </label>
                           </div>
                           <p className="text-xs text-slate-500 mb-2">Excel columns: rollNo, subject, totalMarks, obtainedMarks, meritPosition</p>
                           {offlineResults.length > 0 && (
                             <div className="mt-4">
                               <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Imported Results ({offlineResults.filter((r) => r.approvalStatus === 'PENDING').length} pending)</h4>
                               <div className="space-y-2 max-h-40 overflow-y-auto">
                                 {offlineResults.slice(0, 10).map((r) => (
                                   <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm">
                                     <span className="font-bold">{r.rollNo}</span>
                                     <span>{r.obtainedMarks ?? '—'}/{r.totalMarks ?? '—'}</span>
                                     <div className="flex gap-1">
                                       {r.approvalStatus === 'PENDING' && (
                                         <>
                                           <button onClick={() => handleApproveResult(r.id)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" title="Approve"><CheckCircle2 className="h-4 w-4" /></button>
                                           <button onClick={() => handleRejectResult(r.id)} className="p-1 rounded text-rose-600 hover:bg-rose-50" title="Reject"><XCircle className="h-4 w-4" /></button>
                                         </>
                                       )}
                                       {r.approvalStatus === 'APPROVED' && <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Approved</Badge>}
                                       {r.approvalStatus === 'REJECTED' && <Badge className="text-[9px] bg-rose-100 text-rose-700">Rejected</Badge>}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                               {offlineResults.length > 10 && <p className="text-xs text-slate-400 mt-1">+{offlineResults.length - 10} more</p>}
                             </div>
                           )}
                       {omrScans.length > 0 && (
                         <div className="space-y-2 mb-6">
                           {omrScans.map((scan) => (
                             <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                               <span className="text-sm font-bold text-slate-700 truncate">{scan.fileName || 'OMR scan'}</span>
                               <a href={getOmrScanDownloadUrl(scan.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm font-bold hover:underline">
                                 View
                               </a>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  )}
                  {exam.sets && exam.sets.length > 0 && (
                    <div>
                       <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                          <FileText className="h-4 w-4" />
                          Exam Documents
                       </h3>
                       <div className="flex flex-wrap gap-3 mb-6">
                         <button
                           onClick={exam.pdfUrl ? () => window.open(getExamPdfDownloadUrl(exam.pdfUrl!), '_blank') : handleRegeneratePdf}
                           disabled={pdfLoading}
                           className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 disabled:opacity-50"
                         >
                           <Download className="h-4 w-4" />
                           {pdfLoading ? 'Generating...' : exam.pdfUrl ? 'Download Exam PDF' : 'Generate Exam PDF'}
                         </button>
                         <button
                           onClick={exam.solveSheetUrl ? () => window.open(getExamPdfDownloadUrl(exam.solveSheetUrl!), '_blank') : handleRegenerateSolveSheet}
                           disabled={solveSheetLoading}
                           className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 disabled:opacity-50"
                         >
                           <Download className="h-4 w-4" />
                           {solveSheetLoading ? 'Generating...' : exam.solveSheetUrl ? 'Download Solve Sheet' : 'Generate Solve Sheet'}
                         </button>
                       </div>
                       <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">
                          <Layers className="h-4 w-4" />
                          Active Question Sets
                       </h3>
                       <div className="space-y-3">
                          {exam.sets.map((set) => (
                            <div key={set.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-base">
                                     {set.questions?.length || 0}
                                  </div>
                                  <span className="text-base font-bold text-slate-700">{set.name}</span>
                               </div>
                               <Badge variant="outline" className="rounded-lg text-[9px] uppercase tracking-tighter">Active Set</Badge>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               <div className="space-y-8">
                  <div>
                     <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 mb-4">
                        <History className="h-4 w-4" />
                        Recent Participation
                     </h3>
                     <div className="space-y-3">
                        {exam.attempts && exam.attempts.length > 0 ? (
                          exam.attempts.slice(0, 5).map((attempt) => (
                            <div key={attempt.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-rose-200 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                     <User className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-base font-bold text-slate-800">{attempt.student?.fullName || 'Anonymous Candidate'}</span>
                                     <span className="text-[10px] font-medium text-slate-400">{new Date(attempt.startedAt).toLocaleDateString()}</span>
                                  </div>
                               </div>
                               <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase", 
                                 attempt.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                               )}>{attempt.status}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center p-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                             <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                             <p className="text-base font-bold text-slate-400 uppercase tracking-widest">No candidates logged yet</p>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="rounded-[32px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Platform Meta</p>
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-xl font-black">{exam.allowedAttempts}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attempts Allowed</span>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-800" />
                        <div className="flex flex-col text-right">
                           <span className="text-xl font-black">{exam._count?.attempts || 0}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Logs</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : activeTab === 'leaderboard' ? (
          <ExamLeaderboard examId={exam.id} showLeaderboard={exam.showLeaderboard} />
        ) : (
          <ExamQuestionBuilder 
            examId={exam.id} 
            exam={exam}
            sets={exam.sets || []} 
            onRefresh={fetchExamData} 
          />
        )}
      </div>
    </div>
  );
}
