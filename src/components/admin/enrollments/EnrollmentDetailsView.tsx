'use client';

import { Enrollment } from '@/lib/api/enrollments';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  User, 
  GraduationCap, 
  Building2, 
  Calendar, 
  History,
  CheckCircle2, 
  Hash,
  Activity,
  CreditCard,
  Phone,
  Mail,
  Clock,
  Users
} from 'lucide-react';

interface EnrollmentDetailsViewProps {
  enrollment: Enrollment;
}

function getStatusBadgeClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (s === 'PAUSED') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  if (s === 'COMPLETED') return 'bg-indigo-50 text-indigo-700 border-indigo-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export function EnrollmentDetailsView({ enrollment }: EnrollmentDetailsViewProps) {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {/* Header Hero Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-0 right-0 p-6">
              <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest", getStatusBadgeClass(String(enrollment.status)))}>
                {enrollment.status}
              </Badge>
           </div>
           
           <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="relative">
                 <div className="h-24 w-24 rounded-[32px] bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                    {enrollment.student?.fullName.charAt(0)}
                 </div>
                 <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-2xl border-4 border-white bg-indigo-500 flex items-center justify-center shadow-sm">
                    <GraduationCap className="h-4 w-4 text-white" />
                 </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">{enrollment.student?.fullName}</h2>
                    <p className="text-base font-black uppercase tracking-[0.2em] text-indigo-500">Student Enrollment</p>
                 </div>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                       <Phone className="h-4 w-4 text-emerald-500" />
                       {enrollment.student?.mobile || 'N/A'}
                    </div>
                    {enrollment.student?.email && (
                      <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                         <Mail className="h-4 w-4 text-blue-500" />
                         {enrollment.student?.email}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
           {[
             { label: 'Course Fee', value: enrollment.course ? `৳${Number(enrollment.course.fee).toLocaleString()}` : 'N/A', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Billing Start', value: enrollment.billingStartMonth || 'N/A', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
             { label: 'Joined On', value: new Date(enrollment.createdAt).toLocaleDateString(), icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           ].map((stat, i) => (
             <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
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
                    <Activity className="h-4 w-4" />
                    Academic Context
                 </h3>
                 <div className="grid gap-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Course Program</span>
                          <span className="text-base font-black text-slate-900">{enrollment.course?.name || '-'}</span>
                       </div>
                       <Badge variant="outline" className="rounded-lg bg-white font-mono text-[9px] font-black">{enrollment.course?.code}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Current Batch</span>
                          <span className="text-base font-black text-slate-900">{enrollment.batch?.name || 'Unassigned'}</span>
                       </div>
                       <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-slate-400" />
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Assigned Branch</span>
                          <span className="text-base font-black text-slate-900">{enrollment.branch?.name || '-'}</span>
                       </div>
                       <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    <History className="h-4 w-4" />
                    System Audit
                 </h3>
                 <div className="grid gap-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Record ID</span>
                       <span className="text-base font-mono font-black text-indigo-600 uppercase">{enrollment.id.slice(0, 16)}...</span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Initialized At</span>
                       <span className="text-base font-black text-slate-900">{new Date(enrollment.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500">Last Synced</span>
                       <span className="text-base font-black text-slate-900">{new Date(enrollment.updatedAt).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
