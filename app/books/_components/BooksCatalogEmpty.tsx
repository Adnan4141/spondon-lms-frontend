'use client';

export function BooksCatalogEmpty() {
  return (
    <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:rounded-[30px] sm:p-10">
      <h3 className="text-2xl font-black text-slate-950">এই ফিল্টারে কোনো বই মিলছে না</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">অন্য কীওয়ার্ড দিয়ে সার্চ করুন বা ফিল্টার রিসেট করে আবার চেষ্টা করুন।</p>
    </section>
  );
}
