'use client';

import { type User as TeacherUser } from '@/lib/api/users';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Ban, 
  Calendar,
  Fingerprint,
  User as UserIcon,
  Briefcase,
  History,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TeacherDetailsViewProps = {
  teacher: TeacherUser;
};

export function TeacherDetailsView({ teacher }: TeacherDetailsViewProps) {
  const initials = teacher.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden bg-white text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-10">
          
          {/* Profile Header Card */}
          <section className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-linear-to-br from-indigo-50/50 via-white to-sky-50/30 p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative group">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-black text-3xl shadow-xl shadow-indigo-100 transition-transform group-hover:scale-105 group-hover:rotate-2 overflow-hidden">
                  {teacher.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)}
                      alt={teacher.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-md",
                  teacher.status === 'ACTIVE' ? "bg-emerald-500" : "bg-rose-500"
                )}>
                  {teacher.status === 'ACTIVE' ? <ShieldCheck className="h-4 w-4 text-white" /> : <Ban className="h-4 w-4 text-white" />}
                </div>
              </div>
              
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">{teacher.fullName}</h2>
                  <Badge className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 shadow-sm",
                    teacher.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {teacher.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-slate-500 sm:justify-start">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="h-4 w-4 text-slate-300" />
                    <span className="font-mono uppercase tracking-tight">{teacher.id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-slate-300" />
                    <span>Role: Teacher</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-300" />
                    <span>Joined {new Date(teacher.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Details Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            
            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                  <Phone className="h-4 w-4" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Connectivity</h3>
              </div>
              
              <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                    <p className="text-base font-black text-slate-900">{teacher.mobile}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-500 cursor-pointer">
                    <Phone className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="h-px bg-slate-50" />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                    <p className="text-base font-black text-slate-900">{teacher.email || 'No email provided'}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-500 cursor-pointer">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </section>

            {/* Academic Placement */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-sm">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Node</h3>
              </div>
              
              <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Building2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Branch</p>
                    <p className="text-lg font-black text-slate-900">{teacher.branch?.name || 'Central Administration'}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{teacher.branchId ? `Branch ID: ${teacher.branchId.slice(-8).toUpperCase()}` : 'Global Placement'}</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Quick Stats / Visual Row */}
          <section className="grid gap-4 sm:grid-cols-3">
             {[
               { label: 'Role Access', value: 'Teacher', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
               { label: 'Courses', value: 'Active', icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Activity', value: 'Live Feed', icon: History, color: 'text-amber-600', bg: 'bg-amber-50' },
             ].map((stat, i) => (
               <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm", stat.bg, stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</p>
                    <p className="text-sm font-black text-slate-800">{stat.value}</p>
                  </div>
               </div>
             ))}
          </section>

          {/* Security Log Placeholder */}
          <section className="space-y-4 pb-4">
                <div className="flex items-center gap-2.5 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Security</h3>
             </div>
             
             <div className="rounded-[24px] border border-slate-100 bg-slate-50/30 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                      <UserIcon className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">Role: Teacher</p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">Branch rules apply.</p>
                   </div>
                </div>
                <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest text-slate-400 border-slate-200">
                   Verified
                </Badge>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
