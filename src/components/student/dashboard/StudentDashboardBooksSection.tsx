import Link from 'next/link';
import { MyBookPurchasesPanel, type MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';

type Props = {
  purchases: MyBookPurchaseRow[];
  loading: boolean;
};

export function StudentDashboardBooksSection({ purchases, loading }: Props) {
  const preview = purchases.slice(0, 3);

  return (
    <section className="space-y-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black text-slate-900">আমার বই ও অর্ডার</h2>
        <Link
          href="/student/books#my-books"
          className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
        >
          সব দেখুন →
        </Link>
      </div>
      <MyBookPurchasesPanel purchases={preview} loading={loading} compact />
      {purchases.length > 3 ? (
        <p className="text-center text-sm font-bold text-slate-500">
          <Link href="/student/books#my-books" className="text-indigo-600 hover:underline">
            আরও {purchases.length - 3} টি অর্ডার
          </Link>
        </p>
      ) : null}
    </section>
  );
}
