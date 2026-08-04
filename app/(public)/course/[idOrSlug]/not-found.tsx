import Link from 'next/link';
import { Info } from 'lucide-react';

export default function CourseNotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-40 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Info size={40} />
        </div>
        <h1 className="mb-4 text-3xl font-black text-slate-900">দুঃখিত!</h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-slate-500">কোর্সটি খুঁজে পাওয়া যায়নি।</p>
        <Link
          href="/courses"
          className="inline-block rounded-2xl bg-indigo-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700"
        >
          সকল কোর্স দেখুন
        </Link>
      </div>
    </div>
  );
}
