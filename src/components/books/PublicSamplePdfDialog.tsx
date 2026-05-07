'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookStandardModal } from '@/components/books/BookStandardModal';
import { AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, FileText, LoaderCircle, Search, ZoomIn, ZoomOut } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function SamplePdfViewer({ sampleUrl }: { sampleUrl: string }) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const element = previewRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setPreviewWidth(Math.max(0, Math.floor(element.clientWidth - 32)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const canGoPrevious = currentPage > 1;
  const canGoNext = pageCount > 0 && currentPage < pageCount;

  return (
    <div className="space-y-3 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">
            PDF.js Viewer
          </Badge>
          {pageCount > 0 ? (
            <span className="font-semibold text-slate-700">
              পৃষ্ঠা {currentPage} / {pageCount}
            </span>
          ) : (
            <span>পৃষ্ঠা সংখ্যা লোড হচ্ছে</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setScale((value) => Math.max(0.6, Number((value - 0.1).toFixed(1))))}
            disabled={scale <= 0.6}
          >
            <ZoomOut className="mr-2 h-4 w-4" />
            ছোট করুন
          </Button>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-bold text-slate-700">
            {Math.round(scale * 100)}%
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setScale((value) => Math.min(2, Number((value + 0.1).toFixed(1))))}
            disabled={scale >= 2}
          >
            <ZoomIn className="mr-2 h-4 w-4" />
            বড় করুন
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => canGoPrevious && setCurrentPage((page) => page - 1)}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            আগের পৃষ্ঠা
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => canGoNext && setCurrentPage((page) => page + 1)}
            disabled={!canGoNext}
          >
            পরের পৃষ্ঠা
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={previewRef}
        className="flex min-h-[72vh] items-center justify-center overflow-auto rounded-[22px] border border-slate-200 bg-linear-to-b from-slate-200 via-slate-100 to-white p-4"
      >
        {loadError ? (
          <div className="max-w-lg rounded-[28px] border border-amber-200 bg-white px-6 py-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-slate-900">প্রিভিউ লোড করা যায়নি</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{loadError}</p>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              যদি ফাইলটি অন্য ডোমেইনে থাকে, সেখানে CORS অনুমতি না থাকলে এম্বেডেড PDF প্রিভিউ কাজ নাও করতে পারে।
            </p>
            <Button asChild className="mt-5 rounded-2xl">
              <a href={sampleUrl} target="_blank" rel="noreferrer">
                <Search className="mr-2 h-4 w-4" />
                নতুন ট্যাবে খুলে দেখুন
              </a>
            </Button>
          </div>
        ) : (
          <Document
            file={sampleUrl}
            loading={
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <LoaderCircle className="h-7 w-7 animate-spin" />
                <p className="text-sm font-semibold">নমুনা পিডিএফ লোড হচ্ছে...</p>
              </div>
            }
            error="পিডিএফ লোড করা যায়নি।"
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages);
              setCurrentPage((page) => Math.min(page, numPages));
              setLoadError(null);
            }}
            onLoadError={(error) => {
              setLoadError(error.message || 'অজানা ত্রুটির কারণে নমুনা পিডিএফ দেখানো যাচ্ছে না।');
            }}
            className="flex justify-center"
          >
            <Page
              pageNumber={currentPage}
              width={previewWidth > 0 ? Math.max(280, Math.floor(previewWidth / scale)) : undefined}
              scale={scale}
              loading={
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <LoaderCircle className="h-7 w-7 animate-spin" />
                  <p className="text-sm font-semibold">পৃষ্ঠা রেন্ডার হচ্ছে...</p>
                </div>
              }
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
            />
          </Document>
        )}
      </div>
    </div>
  );
}

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
      maxWidth="max-w-2xl"
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
          {open ? <SamplePdfViewer key={`${sampleUrl}:${open ? 'open' : 'closed'}`} sampleUrl={sampleUrl} /> : null}
        </>
      ) : (
        <div className="flex min-h-105 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
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
