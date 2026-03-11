'use client';

import { Student } from '@/types/student';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Calendar, 
  GraduationCap, 
  History,
  Fingerprint,
  HeartPulse,
  MoreVertical,
  Activity,
  CheckCircle2,
  AlertCircle,
  BookOpenCheck,
} from 'lucide-react';

interface StudentDetailsViewProps {
  student: Student;
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'BLOCKED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export function StudentDetailsView({ student }: StudentDetailsViewProps) {
  const profile = student.studentProfile;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {/* Header Hero Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-0 right-0 p-6">
              <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest", getStatusBadgeClass(student.status))}>
                {student.status}
              </Badge>
           </div>
           
           <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="relative">
                 <div className="h-24 w-24 rounded-[32px] bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                    {student.fullName.charAt(0)}
                 </div>
                 <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-2xl border-4 border-white bg-emerald-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                 </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">{student.fullName}</h2>
                    <p className="text-base font-black uppercase tracking-[0.2em] text-indigo-500">Student Account</p>
                 </div>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                       <Phone className="h-4 w-4 text-emerald-500" />
                       {student.mobile}
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                         <Mail className="h-4 w-4 text-blue-500" />
                         {student.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                       <Building2 className="h-4 w-4 text-rose-500" />
                       {student.branch?.name || 'Unassigned'}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Core Profile Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Enrollments', value: student._count?.enrollments || 0, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Exam Attempts', value: student._count?.examAttempts || 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Joined Date', value: new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
             { label: 'Blood Group', value: profile?.bloodGroup || 'N/A', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
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
                    <Fingerprint className="h-4 w-4" />
                    Extended Identity
                 </h3>
                 <div className="grid gap-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Father's Name</span>
                       <span className="text-base font-black text-slate-900">{profile?.fatherName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Mother's Name</span>
                       <span className="text-base font-black text-slate-900">{profile?.motherName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Date of Birth</span>
                       <span className="text-base font-black text-slate-900">
                         {profile?.dob ? new Date(profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'}
                       </span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Gender</span>
                       <span className="text-base font-black text-slate-900">{profile?.gender || '-'}</span>
                    </div>
                 </div>
              </div>

              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">
                    <MapPin className="h-4 w-4" />
                    Residential Data
                 </h3>
                 <p className="text-base font-medium leading-relaxed text-slate-600 bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm">
                    {profile?.address || 'No residential address provided.'}
                 </p>
              </div>
           </div>

           <div className="space-y-8">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 mb-4">
                    <History className="h-4 w-4" />
                    Active Enrollments
                 </h3>
                 <div className="space-y-3">
                    {student.enrollments && student.enrollments.length > 0 ? (
                      student.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                 <BookOpenCheck className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-base font-bold text-slate-800">{enrollment.course?.name || '-'}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{enrollment.batch?.name || 'No Batch'}</span>
                              </div>
                           </div>
                           <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase bg-slate-50 border-slate-200">{enrollment.status}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                         <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                         <p className="text-base font-bold text-slate-400 uppercase tracking-widest">No active enrollments</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="rounded-[32px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Institutional Reference</p>
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reg Number</span>
                    <span className="text-xl font-black">{profile?.registrationNumber || 'N/A'}</span>
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Institute</span>
                    <span className="text-base font-bold text-slate-300">{profile?.institute?.name || 'N/A'}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
