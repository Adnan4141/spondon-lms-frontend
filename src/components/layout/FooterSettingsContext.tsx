'use client';

import React, { createContext, useContext } from 'react';

const SiteSettingsContext = createContext<Record<string, string>>({});

/** Provides admin Site Settings (navbar + footer) to the public shell. */
export function SiteSettingsProvider({
  siteSettings,
  children,
}: {
  siteSettings: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={siteSettings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

/** @deprecated Use SiteSettingsProvider */
export const FooterSettingsProvider = SiteSettingsProvider;

/** @deprecated Use useSiteSettings */
export function useFooterSettings() {
  return useContext(SiteSettingsContext);
}
