'use client';

import { Star } from 'lucide-react';

export function BookReviewsPlaceholder() {
  return (
    <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
      <Star className="mx-auto h-10 w-10 text-amber-200" />
      <p className="mt-4 font-bold text-slate-700">রিভিউ শীঘ্রই</p>
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto px-4">
        শিক্ষার্থীরা কোর্স শেষে রিভিউ দিতে পারবেন। এখন এই পেজে ক্যাটালগ ও কন্টেন্ট স্ট্রাকচার দেখুন।
      </p>
    </div>
  );
}
