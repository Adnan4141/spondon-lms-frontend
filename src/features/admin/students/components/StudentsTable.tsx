'use client';

import { BookOpen, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BranchOption, Student } from '../types';
import { avatarHue } from '../utils';
import { RowActions } from './RowActions';
import { StudentAdminBadge } from './StudentAdminBadge';

export function StudentsTable({
  students,
  totalStudents,
  branches,
  loading,
  onViewEnrollments,
  onAction,
}: {
  students: Student[];
  totalStudents: number;
  branches: BranchOption[];
  loading: boolean;
  onViewEnrollments: (student: Student) => void;
  onAction: (action: string, student: Student) => void;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-100">
              {['Reg No', 'Full Name', 'Mobile', 'Branch', 'Enrollments', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Loading students…</td></tr>
            )}
            {!loading && students.map(s => {
              const enrollCount = s._count?.enrollments ?? 0;
              const hue = avatarHue(s.fullName);
              return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5"><span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-mono text-xs">{s.regNo}</span></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0" style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}>{s.fullName.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-900">{s.fullName}</p>
                        {s.email && <p className="text-[11px] text-slate-400">{s.email}</p>}
                        <p className="text-[11px] text-rose-600 font-mono mt-0.5">{s.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">{s.mobile}</td>
                  <td className="px-4 py-3.5"><StudentAdminBadge label={branches.find(b => b.id === s.branchId)?.name ?? (s.branchId || '—')} color="slate" /></td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => onViewEnrollments(s)} className={cn('font-bold text-sm px-2.5 py-1 rounded-lg cursor-pointer transition-colors', enrollCount > 0 ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-400 bg-slate-100')}>
                      {enrollCount} {enrollCount === 1 ? 'enrollment' : 'enrollments'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5"><StudentAdminBadge label={s.status} color={s.status === 'ACTIVE' ? 'green' : 'red'} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => onAction('enroll', s)} className="gap-1.5 h-7 px-2.5 text-xs"><BookOpen className="h-3 w-3" /> Enroll</Button>
                      <Button size="sm" onClick={() => onAction('payment', s)} className="gap-1.5 h-7 px-2.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700"><CreditCard className="h-3 w-3" /> Pay</Button>
                      <RowActions student={s} onAction={onAction} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && students.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">No students found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3.5 border-t border-slate-100 flex justify-between items-center">
        <p className="text-xs text-slate-400">Showing {students.length} of {totalStudents} students</p>
        <div className="flex gap-1">
          {['← Prev', '1', '2', '3', 'Next →'].map(p => (
            <button key={p} className={cn('px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer', p === '1' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>{p}</button>
          ))}
        </div>
      </div>
    </>
  );
}
