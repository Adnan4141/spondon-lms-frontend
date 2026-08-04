import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FooterSettingsProvider } from '@/components/layout/FooterSettingsContext';
import { loadPublicSiteSettings } from '@/lib/load-site-settings';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await loadPublicSiteSettings();

  return (
    <FooterSettingsProvider siteSettings={siteSettings}>
      <Header siteSettings={siteSettings} />
      {children}
      <Footer />
    </FooterSettingsProvider>
  );
}
