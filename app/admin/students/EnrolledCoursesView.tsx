'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowLeftRight, Ban, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments } from '@/lib/api/enrollments';
import type { BranchOption, Course, Enrollment, Program, Student } from './types';
import { avatarHue, fmt, fmtMonth, nextMonth, toLocalEnrollment } from './utils';
import { StudentAdminBadge as AppBadge } from './StudentAdminBadge';
import { AddCourseModal } from './AddCourseModal';
import { CancelCourseModal } from './CancelCourseModal';

export function EnrolledCoursesView({
  student, onBack, showToast, programs, allCourses, branches,
}: {
  student: Student;
  onBack: () => void;
  showToast: (msg: string, type?: string) => void;
  programs: Program[];
  allCourses: Course[];
  branches: BranchOption[];
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [cancelModal, setCancelModal] = useState<{ course: Course; enrollment: Enrollment } | null>(null);
  const [addModal, setAddModal] = useState<Enrollment | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropMenuPos, setDropMenuPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const [batchesMap, setBatchesMap] = useState<Map<string, string>>(new Map());
  const dropBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dropMenuRef = useRef<HTMLDivElement>(null);

  // Load all batches and build a lookup map
  useEffect(() => {
    const map = new Map<string, string>();
    // Load first batch of batches (this is a simple approach; for larger datasets, paginate)
    getBatches({ limit: 500 })
      .then(res => {
        if (res.success && res.data) {
          res.data.forEach(b => map.set(b.id, b.name));
        }
        setBatchesMap(map);
      })
      .catch(() => setBatchesMap(new Map()));
  }, []);

  useEffect(() => {
    getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
      if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
      setLoadingEnrollments(false);
    });
  }, [student.id]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const btn = activeDropdown ? dropBtnRefs.current.get(activeDropdown) : null;
      if (
        (!btn || !btn.contains(e.target as Node)) &&
        (!dropMenuRef.current || !dropMenuRef.current.contains(e.target as Node))
      ) {
        setActiveDropdown(null);
      }
    };
    const onScroll = () => { if (activeDropdown) setActiveDropdown(null); };
    document.addEventListener('mousedown', h);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', h);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [activeDropdown]);

  const COURSE_MENU_HEIGHT = 130; // ~3 items
  const handleDropdownToggle = (ecId: string) => {
    if (activeDropdown === ecId) { setActiveDropdown(null); return; }
    const btn = dropBtnRefs.current.get(ecId);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = window.innerWidth - rect.right;
      if (spaceBelow < COURSE_MENU_HEIGHT && rect.top > COURSE_MENU_HEIGHT) {
        setDropMenuPos({ bottom: window.innerHeight - rect.top + 4, right });
      } else {
        setDropMenuPos({ top: rect.bottom + 4, right });
      }
    }
    setActiveDropdown(ecId);
  };

  const hue = avatarHue(student.fullName);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Students
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-sm font-bold text-slate-900">Enrolled Courses</span>
      </div>

      {/* Student info */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-4 shadow-sm">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0"
          style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}
        >
          {student.fullName.charAt(0)}
        </div>
        <div>
          <p className="font-black text-lg text-slate-900">{student.fullName}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500">
              Reg: <strong className="text-rose-700 font-mono">{student.regNo}</strong>
            </span>
            <span className="text-xs text-slate-500">Mobile: {student.mobile}</span>
            <AppBadge label={student.status} color={student.status === 'ACTIVE' ? 'green' : 'red'} />
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-4">
        {['Active', 'Suspended', 'Cancelled'].map((s, i) => (
          <label
            key={s}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-semibold transition-colors',
              i === 0
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            )}
          >
            <input type="checkbox" defaultChecked={i === 0} className="accent-rose-600" />
            {s}
          </label>
        ))}
      </div>

      {/* Per-enrollment sections */}
      {loadingEnrollments && (
        <div className="bg-white border border-slate-200 rounded-2xl py-10 text-center">
          <p className="text-slate-400 text-base">Loading enrollments…</p>
        </div>
      )}
      {!loadingEnrollments && enrollments.map(enrollment => {
        const program = programs.find(p => p.id === enrollment.programId);
        const totalFee = enrollment.courses.filter(ec => ec.status === 'ACTIVE').reduce((s, ec) => {
          const c = allCourses.find(x => x.id === ec.courseId);
          return s + (c?.fee || 0);
        }, 0);
        const netFee = totalFee - (enrollment.monthlyDiscount || 0);

        return (
          <div key={enrollment.id} className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden shadow-sm">
            {/* Program header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-black text-sm text-slate-900">{program?.name}</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <AppBadge label={enrollment.billingType} color="blue" />
                  <AppBadge label={enrollment.status} color={enrollment.status === 'ACTIVE' ? 'green' : 'red'} />
                  <span className="text-xs text-slate-500">From: {fmtMonth(enrollment.billingStartMonth)}</span>
                  <span className="text-xs text-slate-500">
                    Discount: <strong className="text-rose-600">{fmt(enrollment.monthlyDiscount)}/mo</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Net: <strong className="text-emerald-600">{fmt(netFee)}/mo</strong>
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setAddModal(enrollment)}
                className="gap-1.5 bg-slate-900 text-white hover:bg-indigo-600 transition-all shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Course
              </Button>
            </div>

            {/* Courses table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    {['Course', 'Enrolled at', 'Program', 'Branch', 'Batch', 'Course Type', 'Books', 'Status', ''].map(h => (
                      <th
                        key={h}
                        className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollment.courses.map((ec) => {
                    const course = allCourses.find(c => c.id === ec.courseId);
                    if (!course) return null;
                    return (
                      <tr key={ec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-sm text-slate-900">{course.name}</p>
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fmt(course.fee)}/mo</p>
                        </td>
                        <td className="px-3.5 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3.5 py-3">
                          <p className="text-xs text-slate-600 font-medium">{program?.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{enrollment.billingType}</p>
                        </td>
                        <td className="px-3.5 py-3 text-xs text-slate-600">
                          {branches.find(b => b.id === enrollment.branchId)?.name ?? enrollment.branchId}
                        </td>
                        <td className="px-3.5 py-3">
                          {ec.batchId
                            ? <AppBadge label={batchesMap.get(ec.batchId) ?? ec.batchId} color="slate" />
                            : <span className="text-xs text-slate-400">—</span>
                          }
                        </td>
                        <td className="px-3.5 py-3">
                          <AppBadge label={course.type.toLowerCase()} color={course.type === 'OFFLINE' ? 'amber' : 'blue'} />
                        </td>
                        <td className="px-3.5 py-3">
                          <AppBadge label={ec.includeBook ? 'Yes' : 'No'} color={ec.includeBook ? 'green' : 'slate'} />
                        </td>
                        <td className="px-3.5 py-3">
                          <AppBadge label={ec.status || 'Active'} color={ec.status === 'ACTIVE' ? 'green' : 'red'} />
                        </td>
                        <td className="px-3.5 py-3">
                          <button
                            ref={(el) => { if (el) dropBtnRefs.current.set(ec.id, el); else dropBtnRefs.current.delete(ec.id); }}
                            onClick={() => handleDropdownToggle(ec.id)}
                            className={cn(
                              'p-1.5 rounded-md border transition-colors cursor-pointer',
                              activeDropdown === ec.id
                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 hover:border-slate-200',
                            )}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {enrollment.courses.filter(ec => ec.status === 'ACTIVE').length} active courses
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-600">Total fee: <strong>{fmt(totalFee)}/mo</strong></span>
                <span className="text-xs text-slate-600">
                  Discount: <strong className="text-rose-600">−{fmt(enrollment.monthlyDiscount)}/mo</strong>
                </span>
                <span className="text-sm font-black text-emerald-600">Net: {fmt(netFee)}/mo</span>
              </div>
            </div>
          </div>
        );
      })}

      {!loadingEnrollments && enrollments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl py-10 text-center">
          <p className="text-slate-400 text-base">No enrollments found for this student.</p>
        </div>
      )}

      {/* Course action dropdown portal */}
      {activeDropdown && (() => {
        let activeCourse: Course | undefined;
        let activeEnrollment: Enrollment | undefined;
        for (const enr of enrollments) {
          const ec = enr.courses.find(c => c.id === activeDropdown);
          if (ec) { activeCourse = allCourses.find(c => c.id === ec.courseId); activeEnrollment = enr; break; }
        }
        if (!activeCourse || !activeEnrollment) return null;
        return createPortal(
          <div
            ref={dropMenuRef}
            style={{ position: 'fixed', ...dropMenuPos }}
            className="bg-white border border-slate-200 rounded-xl shadow-xl min-w-48 z-9999 overflow-hidden"
          >
            {([
              { id: 'batch', icon: ArrowLeftRight, label: 'Change Batch' },
              { id: 'branch', icon: ArrowLeftRight, label: 'Change Branch' },
              { id: 'cancel', icon: Ban, label: 'Cancel This Course', danger: true },
            ] as { id: string; icon: React.FC<{ className?: string }>; label: string; danger?: boolean }[]).map((a, ai) => (
              <button
                key={a.id}
                onClick={() => {
                  setActiveDropdown(null);
                  if (a.id === 'cancel') setCancelModal({ course: activeCourse!, enrollment: activeEnrollment! });
                }}
                className={cn(
                  'w-full px-3.5 py-2.5 text-left text-sm font-semibold flex items-center gap-2.5 transition-colors cursor-pointer',
                  ai > 0 && 'border-t border-slate-100',
                  a.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-800 hover:bg-slate-50',
                )}
              >
                <a.icon className="h-3.5 w-3.5" /> {a.label}
              </button>
            ))}
          </div>,
          document.body,
        );
      })()}

      {cancelModal && (
        <CancelCourseModal
          course={cancelModal.course}
          enrollment={cancelModal.enrollment}
          allCourses={allCourses}
          studentUserId={student.id}
          onClose={() => setCancelModal(null)}
          onDone={() => {
            showToast(`${cancelModal.course.name} cancelled. Invoices updated from ${fmtMonth(nextMonth())}.`, 'success');
            getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
              if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
            });
          }}
        />
      )}
      {addModal && (
        <AddCourseModal
          enrollment={addModal}
          allCourses={allCourses}
          programs={programs}
          studentUserId={student.id}
          onClose={() => setAddModal(null)}
          onDone={() => {
            showToast('Course added and invoices regenerated!', 'success');
            getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
              if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
            });
          }}
        />
      )}
    </div>
  );
}
