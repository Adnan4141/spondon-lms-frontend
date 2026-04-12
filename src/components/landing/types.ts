import React from 'react';

export interface Feature {
  id: string;
  title: string;
  icon: React.ReactNode;
  previewTitle: string;
  previewTime: string;
}

export interface Testimonial {
  id: string | number;
  quote: string;
  name: string;
  info: string;
  instituteName?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  rating?: number;
  /** Landing trust card — optional lines over image/video */
  mediaCaptionTitle?: string;
  mediaCaptionSubtitle?: string;
}
