'use client';

import { useState } from 'react';
import { getStudentById } from '@/lib/api/students';
import { getStudentResults } from '@/lib/api/student-portal';
import type { Student } from '@/types/student';
import type { StudentResults } from '@/types/academic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, RefreshCw, BarChart3, User, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function AcademicRecordsPage() {
  const { toast, toasts, removeToast } = useToast();

  const [studentIdInput, setStudentIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<StudentResults | null>(null);

  const [viewAttemptDialogOpen, setViewAttemptDialogOpen] = useState(false);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number | null>(null);

  const handleLoadRecords = async () => {
    if (!studentIdInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a Student User ID',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setStudent(null);
      setResults(null);

      const [studentResp, resultsResp] = await Promise.all([
        getStudentById(studentIdInput.trim()),
        getStudentResults(studentIdInput.trim()),
      ]);

      if (!studentResp.success || !studentResp.data) {
        throw new Error(studentResp.message || 'Failed to load student');
      }
      setStudent(studentResp.data);

      if (!resultsResp.success || !resultsResp.data) {
        throw new Error(resultsResp.message || 'Failed to load academic records');
      }
      setResults(resultsResp.data);
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to load academic records';
      setError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onlineAttempts = results?.onlineAttempts || [];
  const offlineResults = results?.offlineResults || [];
  const academicRecords = results?.academicRecords || [];

  const totalOnline = onlineAttempts.length;
  const totalOffline = offlineResults.length;
  const totalRecords = academicRecords.length;

  const selectedAttempt =
    selectedAttemptIndex !== null ? onlineAttempts[selectedAttemptIndex] : null;

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Academic Records</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View an individual student&apos;s academic history, including online exams, offline
              exams, and consolidated academic records.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[260px] flex-1">
            <label className="mb-1 block text-sm font-medium">Student User ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter student user ID..."
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Button className="h-10" onClick={handleLoadRecords} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Load Records
              </>
            )}
          </Button>
        </div>
      </section>

      {error && (
        <section className="glass-panel p-4">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        </section>
      )}

      {student && (
        <section className="glass-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{student.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {student.mobile}
                  {student.email && ` • ${student.email}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span>Enrollments: {student._count?.enrollments ?? 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>Exam Attempts: {student._count?.examAttempts ?? 0}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {results && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="glass-panel p-3.5">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Online Attempts
              </p>
              <p className="mt-2 text-2xl font-semibold">{totalOnline}</p>
            </article>
            <article className="glass-panel p-3.5">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Offline Results
              </p>
              <p className="mt-2 text-2xl font-semibold">{totalOffline}</p>
            </article>
            <article className="glass-panel p-3.5">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Academic Records
              </p>
              <p className="mt-2 text-2xl font-semibold">{totalRecords}</p>
            </article>
          </section>

          {/* Online Attempts */}
          <section className="glass-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Online Exam Attempts</h2>
                <p className="text-xs text-muted-foreground">
                  All online exams taken by this student
                </p>
              </div>
            </div>

            {onlineAttempts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No online exam attempts found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Exam</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onlineAttempts.map((attempt, idx) => (
                    <TableRow
                      key={attempt.id}
                      className="cursor-pointer hover:bg-muted/45"
                      onClick={() => {
                        setSelectedAttemptIndex(idx);
                        setViewAttemptDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {attempt.exam?.title || attempt.examId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{attempt.exam?.type || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            attempt.status === 'SUBMITTED'
                              ? 'default'
                              : attempt.status === 'IN_PROGRESS'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {attempt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {attempt.obtainedMarks !== null && attempt.totalMarks !== null
                          ? `${Number(attempt.obtainedMarks).toFixed(2)} / ${Number(
                              attempt.totalMarks,
                            ).toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(attempt.startedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* Offline Results */}
          <section className="glass-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Offline Exam Results</h2>
                <p className="text-xs text-muted-foreground">
                  Manually entered offline exam results
                </p>
              </div>
            </div>

            {offlineResults.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No offline exam results found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Exam ID</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Merit</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineResults.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.examId}</TableCell>
                      <TableCell>{row.rollNo}</TableCell>
                      <TableCell>{row.subject || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {row.obtainedMarks !== null && row.totalMarks !== null
                          ? `${Number(row.obtainedMarks).toFixed(2)} / ${Number(
                              row.totalMarks,
                            ).toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {row.meritPosition !== null && row.meritPosition !== undefined ? (
                          <Badge variant="outline">#{row.meritPosition}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* Academic Records */}
          <section className="glass-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Consolidated Academic Records</h2>
                <p className="text-xs text-muted-foreground">
                  Normalized records for reporting and merit calculations
                </p>
              </div>
            </div>

            {academicRecords.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No academic records found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Course ID</TableHead>
                    <TableHead>Exam ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicRecords.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <Badge variant="outline">{rec.recordType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{rec.courseId || '-'}</TableCell>
                      <TableCell className="text-xs">{rec.examId || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {rec.score !== null && rec.score !== undefined
                          ? Number(rec.score).toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell>{rec.grade || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rec.remarks || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(rec.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      )}

      {/* View Attempt Dialog (basic metadata) */}
      <Dialog open={viewAttemptDialogOpen} onOpenChange={setViewAttemptDialogOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Attempt Details</DialogTitle>
          </DialogHeader>
          {selectedAttempt ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Exam</p>
                <p className="mt-1 font-medium">
                  {selectedAttempt.exam?.title || selectedAttempt.examId}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Type</p>
                  <p className="mt-1 text-sm">{selectedAttempt.exam?.type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Mode</p>
                  <p className="mt-1 text-sm">{selectedAttempt.exam?.mode || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <p className="mt-1 text-sm">{selectedAttempt.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Score</p>
                  <p className="mt-1 text-sm">
                    {selectedAttempt.obtainedMarks !== null &&
                    selectedAttempt.totalMarks !== null
                      ? `${Number(selectedAttempt.obtainedMarks).toFixed(
                          2,
                        )} / ${Number(selectedAttempt.totalMarks).toFixed(2)}`
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Started At</p>
                  <p className="mt-1 text-xs">
                    {new Date(selectedAttempt.startedAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Submitted At</p>
                  <p className="mt-1 text-xs">
                    {selectedAttempt.submittedAt
                      ? new Date(selectedAttempt.submittedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attempt selected.</p>
          )}
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

