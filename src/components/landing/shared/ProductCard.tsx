'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export interface ProductCardProps {
  image: string;
  title: string;
  subtext: string;
  price: string;
  previousPrice: string;
  bundle?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ image, title, subtext, price, previousPrice, bundle }) => {
  const discount = previousPrice
    ? Math.round(
        ((parseInt(previousPrice.replace(/\D/g, '')) - parseInt(price.replace(/\D/g, ''))) /
          parseInt(previousPrice.replace(/\D/g, ''))) *
          100
      )
    : 0;

  return (
    <motion.div
      variants={fadeInScale}
      className="group bg-white rounded-[24px] border border-slate-100 p-4 flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 ease-out"
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[20px] bg-slate-50 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]',
          bundle ? 'aspect-video' : 'aspect-[3/4]'
        )}
      >
        <img
          src={image || 'https://placehold.co/400x600?text=Book'}
          alt={title}
          className="w-full h-full object-contain p-4 drop-shadow-xl"
          onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x600?text=Book+Cover')}
        />
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 mt-5">
        <div className="space-y-2">
          <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight line-clamp-2 group-hover:text-[#5C2D91] transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 text-[13px] leading-snug line-clamp-2 italic">{subtext}</p>
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-slate-400 line-through text-[11px] font-bold">{previousPrice}</span>
            <span className="text-[#10B981] font-black text-xl tracking-tight">{price}</span>
          </div>
          <Button className="bg-[#10B981] hover:bg-slate-900 text-white text-xs font-bold px-5 h-10 rounded-xl transition-all shadow-md active:scale-95">
            Buy Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
