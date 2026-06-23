import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Layout, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseDetailBatch, CourseDetails, PublicCourseSidebarFeature } from '@/types/course';

type Props = {
  course: CourseDetails;
  sidebarFeaturesCustom: PublicCourseSidebarFeature[];
  sidebarCardTitle: string;
  enrollTotal: number;
  effectiveCourseFee: number;
  booksAddonTotal: number;
  offlineBatches: CourseDetailBatch[];
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  alreadyEnrolled: boolean;
  enrolling: boolean;
  handleEnrollClick: () => void;
  loading: boolean;
};

export function CourseSidebar({
  course,
  sidebarFeaturesCustom,
  sidebarCardTitle,
  enrollTotal,
  effectiveCourseFee,
  booksAddonTotal,
  offlineBatches,
  selectedBatchId,
  setSelectedBatchId,
  alreadyEnrolled,
  enrolling,
  handleEnrollClick,
  loading,
}: Props) {
  return (
    <aside className="space-y-8">
      <div className="sticky top-28 overflow-hidden rounded-[32px] border border-slate-100 bg-white/80 backdrop-blur-md p-8 shadow-xl shadow-slate-100/40 relative">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-[#5C2D91]" />
        
        <h3 className="mb-6 border-b border-slate-100/80 pb-4 text-lg font-black text-slate-900 tracking-tight mt-1">
          {sidebarCardTitle}
        </h3>

        {/* Features list */}
        <div className="space-y-4">
          {sidebarFeaturesCustom.length > 0 ? (
            sidebarFeaturesCustom.map((f, idx) => (
              <FeatureRow key={f.id} icon={f.icon} label={f.label} value={f.value} index={idx} />
            ))
          ) : course.features && course.features.length > 0 ? (
            course.features.map((f, idx) => (
              <FeatureRow key={f.id} icon={f.icon} label={f.label} value={f.value} index={idx} />
            ))
          ) : (
            <div className="space-y-4">
              <FeatureRow 
                icon="🌐" 
                label="কোর্স মোড" 
                value={course.type === 'ONLINE' ? 'অনলাইন' : 'অফলাইন'} 
                index={0} 
              />
              <FeatureRow 
                icon="💳" 
                label="পেমেন্ট পদ্ধতি" 
                value={course.type === 'ONLINE' ? 'এককালীন পেমেন্ট' : 'ভর্তির সময় নির্ধারিত'} 
                index={1} 
              />
            </div>
          )}
        </div>

        {/* Pricing + Enroll CTA */}
        <div className="mt-8 border-t border-slate-100/80 pt-8">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">কোর্স ফি</span>
            <div className="flex flex-col items-end">
              <span className="text-4xl font-extrabold text-[#5C2D91] tracking-tight">৳{enrollTotal.toLocaleString()}</span>
            </div>
          </div>

          {course.offerPrice != null && Number(course.offerPrice) < Number(course.fee) && (
            <div className="mb-4 flex items-center justify-end gap-2 text-right">
              <span className="text-sm text-slate-400 line-through">৳{Number(course.fee).toLocaleString()}</span>
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-600 ring-1 ring-inset ring-rose-200 animate-pulse">
                🔥 {Math.round(((Number(course.fee) - Number(course.offerPrice)) / Number(course.fee)) * 100)}% ছাড়
              </span>
            </div>
          )}

          {booksAddonTotal > 0 ? (
            <div className="mb-6 rounded-2xl bg-indigo-50/50 p-3.5 text-center text-xs font-medium text-indigo-700 border border-indigo-50/80">
              কোর্স: ৳{effectiveCourseFee.toLocaleString()} + বই: ৳{booksAddonTotal.toLocaleString()}
            </div>
          ) : (
            <div className="mb-6" />
          )}

          {alreadyEnrolled ? (
            <Link
              href="/student/courses"
              className="group flex h-15 w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 font-extrabold text-sm tracking-wide text-white shadow-lg shadow-emerald-100/50 transition-all hover:bg-emerald-700 active:scale-98"
            >
              <CheckCircle2 size={18} />
              কোর্সটি ক্লাসরুম থেকে ভিজিট করুন
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              onClick={handleEnrollClick}
              disabled={enrolling}
              className="group flex h-15 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5C2D91] to-[#7A3EB2] font-extrabold text-sm tracking-wide text-white shadow-lg shadow-[#5C2D91]/20 transition-all hover:shadow-xl hover:shadow-[#5C2D91]/30 active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {enrolling ? 'প্রসেসিং হচ্ছে...' : 'এখনই ভর্তি হোন'}
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Lock size={12} className="text-slate-400" />
            <span>নিরাপদ পেমেন্ট গ্যারান্টি</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FeatureRow({ icon, label, value, index }: { icon?: string | null; label: string; value: string; index: number }) {
  // Rotate dynamic styles for icons
  const styles = [
    { bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' },
    { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' },
    { bg: 'bg-amber-50 text-amber-600 border border-amber-100/50' },
    { bg: 'bg-rose-50 text-rose-600 border border-rose-100/50' },
  ];
  const activeStyle = styles[index % styles.length];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/30 p-3.5 transition-all hover:bg-slate-50/70 hover:border-slate-100">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black shadow-xs", activeStyle.bg)}>
        {icon || '✦'}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
        <span className="truncate text-sm font-bold text-slate-700 mt-0.5">{value}</span>
      </div>
    </div>
  );
}
