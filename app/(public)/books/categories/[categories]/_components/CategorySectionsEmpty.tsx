'use client';

export function CategorySectionsEmpty() {
  return (
    <section className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">কোনো ক্যাটাগরি পাওয়া যায়নি</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        বর্তমান ফিল্টারে কোনো বই বা ক্যাটাগরি মিলছে না। অন্য সার্চ বা ফরম্যাট দিয়ে চেষ্টা করুন।
      </p>
    </section>
  );
}
