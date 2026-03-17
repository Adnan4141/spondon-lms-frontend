'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface Props {
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
}

export const PaymentSection: React.FC<Props> = ({ handleImageError }) => (
  <section className="relative py-12 sm:py-20 md:py-28 overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50">
    
    {/* Gradient Blobs */}
    <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-sky-200/40 blur-[120px] rounded-full"></div>
    <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-200/40 blur-[120px] rounded-full"></div>

    <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
      <div className="flex flex-col items-center gap-14">

        {/* Title */}
        <div className="text-center space-y-4">
          <Badge className="bg-white/70 backdrop-blur-md text-blue-600 border border-blue-100 px-6 py-2 text-[10px] font-black uppercase tracking-[0.25em] rounded-full shadow">
            Secure Checkout
          </Badge>

          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
            পেমেন্ট পার্টনার
          </h3>

          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Trusted payment gateways ensuring safe and secure transactions
          </p>
        </div>

        {/* Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="group relative w-full max-w-4xl rounded-[44px] p-[2px] bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 shadow-xl"
        >
          
          {/* Glass Card */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-[42px] p-6 sm:p-10 md:p-16 flex items-center justify-center transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl">

            {/* Glow */}
            <div className="absolute inset-0 rounded-[42px] opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-blue-200/30 via-sky-200/30 to-indigo-200/30 blur-2xl"></div>

            <img
              src="/images/SSL-Commerz-Pay-With-logo-All-Size-01-570x213.png"
              alt="SSLCommerz Payment Partners"
              className="relative max-w-full h-auto object-contain drop-shadow-xl grayscale-[0.2] group-hover:grayscale-0 transition duration-500"
              onError={(e) => handleImageError(e, 'Payment Gateway')}
            />

          </div>
        </motion.div>

        {/* Footer */}
        <div className="flex items-center gap-4 text-slate-300">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">
            Verified by SSLCOMMERZ
          </p>
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>

      </div>
    </div>
  </section>
);