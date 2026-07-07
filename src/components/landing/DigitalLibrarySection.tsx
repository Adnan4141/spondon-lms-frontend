import Link from 'next/link';
import type { LandingLibraryBook } from '@/lib/api/landing-data';
import { Button } from '@/components/ui/button';
import { LandingBookCard } from './LandingBookCard';

interface Props {
  dynamicEbooks: LandingLibraryBook[];
  badge?: string;
  title?: string;
  titleHighlight?: string;
  buttonText?: string;
}

export function DigitalLibrarySection({
  dynamicEbooks,
  badge = 'Learning Resource',
  title = 'স্মার্ট বইয়ের',
  titleHighlight = 'কালেকশন',
  buttonText = 'সকল বই দেখুন',
}: Props) {
  return (
    <section className="relative overflow-hidden bg-[#0A0F1C] py-16 sm:py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute top-[-15%] right-[-10%] h-[80%] w-[80%] rounded-full bg-[#10B981]/15 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[70%] w-[70%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '10px 10px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 space-y-4 text-center sm:mb-20 sm:space-y-6">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 sm:px-5 sm:py-2 sm:text-[10px] sm:tracking-[0.3em]">
            {badge}
          </span>
          <h2 className="text-2xl font-black leading-tight tracking-tighter text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            {title}{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </h2>
        </div>

        <div className="mb-16 flex flex-col items-center justify-between gap-6 rounded-[40px] border border-white/[0.1] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl md:flex-row">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-10 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_20px_#10B981] sm:h-14" />
            <div>
              <h3 className="text-lg font-black tracking-tight text-white sm:text-xl md:text-2xl">সব বুকগুলো</h3>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                বিস্তারিত ও কেনাকাটা
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-3">
              <span className="text-sm font-bold text-slate-400">কালেকশন:</span>
              <span className="text-lg font-black text-white">
                {dynamicEbooks.length}{' '}
                <span className="ml-1 text-xs font-bold tracking-widest text-emerald-400">BOOKS</span>
              </span>
            </div>
            <Button
              asChild
              className="rounded-2xl bg-emerald-500 py-6 text-[12px] font-black uppercase tracking-widest text-white hover:bg-emerald-400"
            >
              <Link href="/books">{buttonText}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {dynamicEbooks.length === 0 ? (
            <div className="col-span-full rounded-[40px] border border-white/10 bg-white/[0.04] px-8 py-16 text-center backdrop-blur-md">
              <p className="text-lg font-black text-white">বই শীঘ্রই যুক্ত হবে</p>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
                ক্যাটালগ লোড হচ্ছে না বা এখনও কোনো বই নেই।{' '}
                <Link href="/books" className="text-emerald-400 underline-offset-2 hover:underline">
                  সকল বই দেখুন
                </Link>
              </p>
            </div>
          ) : (
            dynamicEbooks.map((book) => <LandingBookCard key={book.id} book={book} />)
          )}
        </div>
      </div>
    </section>
  );
}
