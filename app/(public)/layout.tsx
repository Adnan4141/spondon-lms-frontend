import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SiteSettingsProvider } from '@/components/layout/FooterSettingsContext';
import { PublicContentSkeleton } from '@/components/layout/PublicContentSkeleton';
import { loadPublicSiteSettings } from '@/lib/load-site-settings';

/**
 * Shared marketing shell: navbar + dynamic page content + footer.
 * Site Settings (Admin → Site Settings) drive navbar/footer copy & links.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await loadPublicSiteSettings();

  return (
    <SiteSettingsProvider siteSettings={siteSettings}>
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <Header siteSettings={siteSettings} />
        <main className="w-full flex-1">
          <Suspense fallback={<PublicContentSkeleton />}>{children}</Suspense>
        </main>
        <Footer />
      </div>
    </SiteSettingsProvider>
  );
}
