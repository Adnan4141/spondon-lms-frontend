import React from 'react';

export interface Feature {
  id: string;
  title: string;
  icon: React.ReactNode;
  previewTitle: string;
  previewTime: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  info: string;
  thumbnailUrl?: string;
  rating?: number;
}
