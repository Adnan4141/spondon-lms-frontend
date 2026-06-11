'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const PAYMENT_LOGO = '/images/collaborator/bikash-logo.png';
const PAYMENT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='140'%3E%3Crect width='300' height='140' fill='%235C2D91'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='14' font-family='sans-serif'%3EPayment%3C/text%3E%3C/svg%3E";

interface Props {
  badge?: string;
  title?: string;
  subtitle?: string;
  footerText?: string;
}

export const PaymentSection: React.FC<Props> = ({
  badge = 'Secure Checkout',
  title = 'পেমেন্ট পার্টনার',
  subtitle = 'Trusted payment gateways ensuring safe and secure transactions',
  footerText = 'Powered by bKash',
}) => {
  const [imgSrc, setImgSrc] = useState(PAYMENT_LOGO);

  return (
  <section className="relative overflow-hidden bg-linear-to-br from-sky-50 via-white to-indigo-50 py-14 sm:py-16 md:py-20 lg:py-24">
    <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl sm:h-96 sm:w-96" />
    <div className="absolute -bottom-24 -right-28 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl sm:h-96 sm:w-96" />

    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 sm:gap-10">
        <div className="max-w-2xl space-y-4 text-center">
          <Badge className="border border-blue-100 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 shadow-sm backdrop-blur-md sm:px-5">
            {badge}
          </Badge>

          <h3 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {title}
          </h3>

          <p className="mx-auto max-w-lg text-sm font-medium leading-6 text-slate-500 sm:text-base">
            {subtitle}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="group relative w-full max-w-3xl rounded-[28px] bg-linear-to-r from-sky-300 via-blue-300 to-indigo-300 p-px shadow-[0_24px_70px_rgba(37,99,235,0.12)] sm:rounded-[36px]"
        >
          <div className="relative flex min-h-[150px] items-center justify-center overflow-hidden rounded-[27px] border border-white/70 bg-white/85 px-6 py-10 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl sm:min-h-[230px] sm:rounded-[35px] sm:px-12 sm:py-12 md:min-h-[260px]">
            <div className="absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-full bg-blue-100/60 blur-3xl opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

            <Image
              src={imgSrc}
              alt="bKash Payment Partner"
              width={2000}
              height={918}
              className="relative h-auto w-full max-w-[200px] object-contain drop-shadow-xl transition duration-500 group-hover:scale-[1.03] 
              sm:max-w-[250px] md:max-w-[300px]"
              onError={() => setImgSrc(PAYMENT_PLACEHOLDER)}
            />
          </div>
        </motion.div>

        <div className="flex w-full max-w-xl items-center gap-3 text-slate-300 sm:gap-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-300 to-slate-300/30" />
          <p className="shrink-0 text-center text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 sm:text-[11px] sm:tracking-[0.32em]">
            {footerText}
          </p>
          <div className="h-px flex-1 bg-linear-to-l from-transparent via-slate-300 to-slate-300/30" />
        </div>
      </div>
    </div>
  </section>
  );
};
