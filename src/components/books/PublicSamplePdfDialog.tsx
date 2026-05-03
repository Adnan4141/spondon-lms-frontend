'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookStandardModal } from '@/components/books/BookStandardModal';
import { ExternalLink, FileText } from 'lucide-react';

export function PublicSamplePdfDialog({
  open,
  onClose,
  bookName,
  sampleUrl,
}: {
  open: boolean;
  onClose: () => void;
  bookName: string;
  sampleUrl?: string | null;
}) {
  return (
    <BookStandardModal
      open={open}
      onClose={onClose}
      title={`${bookName} · নমুনা প্রিভিউ`}
      subtitle="নমুনা পিডিএফ দেখার জন্য নিরাপদ ডায়ালগ"
      bodyClassName="space-y-4"
    >
      {sampleUrl ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">জনসাধারণের নমুনা পিডিএফ</p>
              <p className="text-xs text-slate-500">
                নির্বাচিত পাতা দেখতে পারবেন; সম্পূর্ণ ই-বুক ফাইল এখানে দেখানো হয় না।
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={sampleUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                নতুন ট্যাবে খুলুন
              </a>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
            <iframe src={sampleUrl} title={`${bookName} নমুনা পিডিএফ`} className="h-[72vh] w-full bg-white" />
          </div>
        </>
      ) : (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-2xl font-black text-slate-900">নমুনা পিডিএফ এখনো যুক্ত করা হয়নি</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            এই বইয়ের জন্য নমুনা ফাইল যোগ করা হলে এখানে প্রিভিউ দেখা যাবে। সম্পূর্ণ ই-বুক সুরক্ষিত থাকবে।
          </p>
          <Badge variant="outline" className="mt-5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em]">
            ভবিষ্যতে নমুনা আপলোডের জন্য প্রস্তুত
          </Badge>
        </div>
      )}
    </BookStandardModal>
  );
}
