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
        <h2 className="text-2xl font-black text-slate-900">My Books & Orders</h2>
        <Link
          href="/student/books#my-books"
          className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
        >
          View all
        </Link>
      </div>
      <MyBookPurchasesPanel purchases={preview} loading={loading} compact />
      {purchases.length > 3 ? (
        <p className="text-center text-sm font-bold text-slate-500">
          <Link href="/student/books#my-books" className="text-indigo-600 hover:underline">
            {purchases.length - 3} more orders
          </Link>
        </p>
      ) : null}
    </section>
  );
}
