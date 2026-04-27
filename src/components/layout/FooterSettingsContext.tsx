'use client';

import React, { createContext, useContext } from 'react';

const FooterSettingsContext = createContext<Record<string, string>>({});

export function FooterSettingsProvider({
  siteSettings,
  children,
}: {
  siteSettings: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <FooterSettingsContext.Provider value={siteSettings}>
      {children}
    </FooterSettingsContext.Provider>
  );
}

export function useFooterSettings() {
  return useContext(FooterSettingsContext);
}
