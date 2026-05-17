import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <div className="sticky top-28 rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
        <h3 className="mb-8 border-b border-slate-50 pb-4 text-xl font-black text-slate-900">
          {sidebarCardTitle}
        </h3>

        {/* Features */}
        {sidebarFeaturesCustom.length > 0 ? (
          <div className="space-y-5">
            {sidebarFeaturesCustom.map((f) => (
              <FeatureRow key={f.id} icon={f.icon} label={f.label} value={f.value} />
            ))}
          </div>
        ) : course.features && course.features.length > 0 ? (
          <div className="space-y-5">
            {course.features.map((f) => (
              <FeatureRow key={f.id} icon={f.icon} label={f.label} value={f.value} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-indigo-600">
                <Globe size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400">কোর্স মোড</span>
                <span className="font-bold text-slate-700">
                  {course.type === 'ONLINE' ? 'অনলাইন' : 'অফলাইন'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-emerald-600">
                <Layout size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400">পেমেন্ট</span>
                <span className="font-bold text-slate-700">
                  {course.type === 'ONLINE' ? 'এককালীন পেমেন্ট' : 'ভর্তির সময় নির্ধারিত'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pricing + Enroll CTA */}
        <div className="mt-10 border-t border-slate-50 pt-10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">মোট ফি</span>
            <span className="text-4xl font-black text-[#5C2D91]">৳{enrollTotal.toLocaleString()}</span>
          </div>

          {course.offerPrice != null && Number(course.offerPrice) < Number(course.fee) && (
            <p className="mb-1 text-right text-xs font-bold">
              <span className="mr-2 text-slate-400 line-through">৳{Number(course.fee).toLocaleString()}</span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                🔥 {Math.round(((Number(course.fee) - Number(course.offerPrice)) / Number(course.fee)) * 100)}% OFF
              </span>
            </p>
          )}

          {booksAddonTotal > 0 ? (
            <p className="mb-6 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
              কোর্স ৳{effectiveCourseFee.toLocaleString()} + বই ৳{booksAddonTotal.toLocaleString()}
            </p>
          ) : (
            <div className="mb-6" />
          )}

          {/* Batch selector */}
          {course.type === 'OFFLINE' && offlineBatches.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Batch নির্বাচন করুন</p>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-800">
                  <SelectValue placeholder="Batch বেছে নিন" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {offlineBatches.map((b) => {
                    const seats = b.availableSeats;
                    const isFull = seats === 0;
                    return (
                      <SelectItem key={b.id} value={b.id} disabled={isFull} className="font-bold">
                        {b.name}
                        {seats != null ? (
                          <span className={cn('ml-2 text-[10px] font-black', isFull ? 'text-rose-500' : 'text-slate-400')}>
                            {isFull ? '· পূর্ণ' : `· ${seats} seats`}
                          </span>
                        ) : null}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {course.type === 'OFFLINE' && offlineBatches.length === 0 && !loading && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              সব ব্যাচ পূর্ণ। নতুন ব্যাচ শীঘ্রই আসছে।
            </div>
          )}

          {alreadyEnrolled ? (
            <Link
              href="/student/courses"
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 font-black uppercase text-sm tracking-widest text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95"
            >
              <CheckCircle2 size={20} /> কোর্সটি ভিজিট করুন। <ArrowRight size={20} />
            </Link>
          ) : (
            <button
              onClick={handleEnrollClick}
              disabled={enrolling}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#5C2D91] font-black uppercase text-sm tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-[#4A2475] active:scale-95 disabled:opacity-70"
            >
              {enrolling ? 'প্রসেসিং...' : 'এখনই ভর্তি হোন'} <ArrowRight size={20} />
            </button>
          )}

          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            নিরাপদ পেমেন্ট গ্যারান্টি
          </p>
        </div>
      </div>
    </aside>
  );
}

function FeatureRow({ icon, label, value }: { icon?: string | null; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-base font-black text-indigo-600">
        {icon || '✦'}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="truncate text-sm font-bold text-slate-700">{value}</span>
      </div>
    </div>
  );
}
