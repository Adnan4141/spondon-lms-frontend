'use client';

import { Batch } from '@/lib/api/batches';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Users, 
  MapPin, 
  BookOpen, 
  Clock, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Layout
} from 'lucide-react';

interface BatchDetailsViewProps {
  batch: Batch;
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (status === 'INACTIVE') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export function BatchDetailsView({ batch }: BatchDetailsViewProps) {
  const enrollmentRate = batch.capacity ? Math.round(((batch._count?.enrollments || 0) / batch.capacity) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-0 right-0 p-6">
              <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest", getStatusBadgeClass(String(batch.status)))}>
                {batch.status}
              </Badge>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                    <Layout className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Operational Batch</span>
                    <span className="text-[10px] font-bold text-slate-400">ID: {batch.id.slice(0, 12)}...</span>
                 </div>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{batch.name}</h2>
              
              <div className="flex flex-wrap gap-6 pt-2">
                 <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    {batch.course?.name}
                 </div>
                 <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    {batch.branch?.name}
                 </div>
              </div>
           </div>
        </div>

        {/* Operational Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Occupancy', value: `${enrollmentRate}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Enrollments', value: batch._count?.enrollments || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Capacity', value: batch.capacity || '∞', icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50' },
             { label: 'Sessions', value: batch._count?.classSessions || 0, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
           ].map((stat, i) => (
             <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                   <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
             </div>
           ))}
        </div>

        {/* Detailed Metrics */}
        <div className="grid gap-10 md:grid-cols-2">
           <div className="space-y-8">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                    <Calendar className="h-4 w-4" />
                    Scheduling Timeline
                 </h3>
                 <div className="grid gap-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500 uppercase tracking-wider">Commencement</span>
                       <span className="text-base font-black text-slate-900">
                         {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBA'}
                       </span>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                       <span className="text-base font-bold text-slate-500 uppercase tracking-wider">Target Conclusion</span>
                       <span className="text-base font-black text-slate-900">
                         {batch.endDate ? new Date(batch.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Continuous'}
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    Capacity Utilization
                 </h3>
                 <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-base font-bold text-slate-400 uppercase">Available Slots</span>
                       <span className="text-base font-black text-indigo-600">
                         {(batch.capacity || 0) - (batch._count?.enrollments || 0)} Remaining
                       </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={cn(
                           "h-full rounded-full transition-all duration-1000",
                           enrollmentRate > 90 ? "bg-rose-500" : enrollmentRate > 70 ? "bg-amber-500" : "bg-indigo-500"
                         )} 
                         style={{ width: `${enrollmentRate}%` }} 
                       />
                    </div>
                    <p className="mt-4 text-[10px] font-medium text-slate-400 leading-relaxed">
                      Capacity management is critical for resource allocation and session planning.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
