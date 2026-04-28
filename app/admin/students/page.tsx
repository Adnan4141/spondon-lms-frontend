'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getUsers } from '@/lib/api/users';
import { AddStudentModal } from '@/features/admin/students';
import { BulkImportStudentsModal } from '@/features/admin/students';
import { CollectPaymentModal } from '@/features/admin/students';
import { EditStudentModal } from '@/features/admin/students';
import { EnrolledCoursesView } from '@/features/admin/students';
import { EnrollmentModal } from '@/features/admin/students';
import { StudentsStats } from '@/features/admin/students';
import { StudentsTable } from '@/features/admin/students';
import { StudentsToolbar } from '@/features/admin/students';
import type { BranchOption, Course, Program, Student } from '@/features/admin/students';
import { fmt, fmtMonth } from '@/features/admin/students';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [view, setView] = useState<'list' | 'enrollments'>('list');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [modal, setModal] = useState<{ type: string; student?: Student } | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const mapUsersToStudents = useCallback((data: NonNullable<Awaited<ReturnType<typeof getUsers>>['data']>) => {
    type ApiStudentUser = (typeof data)[0] & {
      studentProfile?: { registrationNumber?: string };
      _count?: { enrollments?: number };
    };
    return (data as ApiStudentUser[]).map(u => ({
      id: u.id,
      regNo: u.studentProfile?.registrationNumber ?? '—',
      fullName: u.fullName,
      mobile: u.mobile,
      email: u.email ?? null,
      status: u.status as 'ACTIVE' | 'BLOCKED',
      branchId: u.branchId ?? '',
      createdAt: u.createdAt ?? '',
      _count: u._count,
    }));
  }, []);

  const loadStudents = useCallback(() => {
    setLoadingStudents(true);
    getUsers({
      role: 'STUDENT',
      limit: 500,
      ...(branchFilter !== 'ALL' ? { branchId: branchFilter } : {}),
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(programFilter !== 'ALL' ? { programId: programFilter } : {}),
    })
      .then(res => {
        if (res.success && res.data) setStudents(mapUsersToStudents(res.data));
        else setStudents([]);
      })
      .finally(() => setLoadingStudents(false));
  }, [branchFilter, statusFilter, programFilter, mapUsersToStudents]);

  useEffect(() => {
    void Promise.resolve().then(loadStudents);
  }, [loadStudents]);

  useEffect(() => {
    getPrograms().then(res => {
      if (res.success && res.data) setPrograms(res.data as Program[]);
    });
    getBranches().then(res => {
      if (res.success && res.data) setBranches(res.data.map(b => ({ id: b.id, name: b.name })));
    });
    getCourses({ limit: 500 }).then(res => {
      if (res.success && res.data) {
        setAllCourses(res.data.map(c => ({
          id: c.id,
          name: c.name,
          programId: c.programId,
          fee: Number(c.fee ?? 0),
          type: (c.type === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as 'OFFLINE' | 'ONLINE',
          startMonth: c.startMonth ?? '',
          endMonth: c.endMonth ?? '',
          batches: [],
        })));
      }
    });
  }, []);

  const showToast = (msg: string, type = 'success') => {
    toast({ title: msg, variant: type === 'error' ? 'destructive' : 'default' });
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.fullName.toLowerCase().includes(q) || s.mobile.includes(q) || s.regNo.includes(q)) &&
      (statusFilter === 'ALL' || s.status === statusFilter) &&
      (branchFilter === 'ALL' || s.branchId === branchFilter)
    );
  });

  const openEnrollments = (student: Student) => {
    setActiveStudent(student);
    setView('enrollments');
  };

  const handleAction = (action: string, student: Student) => {
    if (action === 'view') router.push(`/admin/students/${student.regNo}`);
    else if (action === 'enrollments') openEnrollments(student);
    else if (action === 'enroll') setModal({ type: 'enroll', student });
    else if (action === 'payment') setModal({ type: 'payment', student });
    else if (action === 'edit') setEditStudent(student);
    else showToast(`"${action}" action for ${student.fullName}`, 'info');
  };

  if (view === 'enrollments' && activeStudent) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50">
        <EnrolledCoursesView
          student={activeStudent}
          onBack={() => setView('list')}
          showToast={showToast}
          programs={programs}
          allCourses={allCourses}
          branches={branches}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6 sm:p-0 bg-slate-50/50">
      <StudentsStats students={students} />
           
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <StudentsToolbar
          count={filtered.length}
          search={search}
          onSearchChange={setSearch}
          programFilter={programFilter}
          onProgramFilterChange={setProgramFilter}
          branchFilter={branchFilter}
          onBranchFilterChange={setBranchFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          programs={programs}
          branches={branches}
          onAddStudent={() => setModal({ type: 'addStudent' })}
          onBulkImport={() => setModal({ type: 'bulkImport' })}
        />

        <StudentsTable
          students={filtered}
          totalStudents={students.length}
          branches={branches}
          loading={loadingStudents}
          onViewEnrollments={openEnrollments}
          onAction={handleAction}
        />
      </div>

      {modal?.type === 'addStudent' && (
        <AddStudentModal
          onClose={() => setModal(null)}
          onSave={s => {
            setStudents(p => [s, ...p]);
            setModal(null);
            showToast(`Student ${s.fullName} created! Reg: ${s.regNo}`, 'success');
          }}
        />
      )}

      {modal?.type === 'bulkImport' && (
        <BulkImportStudentsModal
          branches={branches}
          defaultBranchId={branchFilter !== 'ALL' ? branchFilter : undefined}
          onClose={() => setModal(null)}
          onImported={(result) => {
            loadStudents();
            showToast(`Imported ${result.created} student(s). ${result.errors.length} row error(s).`, result.errors.length ? 'error' : 'success');
          }}
        />
      )}

      {modal?.type === 'enroll' && modal.student && (
        <EnrollmentModal
          student={modal.student}
          programs={programs}
          allCourses={allCourses}
          branches={branches}
          onClose={() => setModal(null)}
          onSave={data => {
            setStudents(prev => prev.map(s =>
              s.id === data.student.id
                ? { ...s, _count: { ...s._count, enrollments: (s._count?.enrollments ?? 0) + 1 } }
                : s
            ));
            setModal(null);
            showToast(`Enrollment confirmed for ${data.student.fullName}!`, 'success');
          }}
        />
      )}

      {modal?.type === 'payment' && modal.student && (
        <CollectPaymentModal
          student={modal.student}
          onClose={() => setModal(null)}
          onSave={data => {
            setModal(null);
            showToast(`${fmt(data.amount)} collected via ${data.method} for ${fmtMonth(data.month)}`, 'success');
          }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={updated => {
            setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
            setEditStudent(null);
            showToast(`${updated.fullName}'s profile updated successfully`, 'success');
          }}
        />
      )}

      <Toaster />
    </div>
  );
}
