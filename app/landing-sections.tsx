import dynamic from 'next/dynamic';
import {
  getLandingCoursesData,
  getLandingFooterData,
  getLandingLibraryData,
  getLandingPartnersData,
  getLandingTeachersData,
  getLandingTrustData,
} from '@/lib/api/landing-data';

const CoursesSection = dynamic(
  () => import('@/components/landing/CoursesSection').then((m) => ({ default: m.CoursesSection })),
);

const TrustSection = dynamic(
  () => import('@/components/landing/TrustSection').then((m) => ({ default: m.TrustSection })),
);

const TeachersSection = dynamic(
  () => import('@/components/landing/TeachersSection').then((m) => ({ default: m.TeachersSection })),
);

const DigitalLibrarySection = dynamic(
  () =>
    import('@/components/landing/DigitalLibrarySection').then((m) => ({
      default: m.DigitalLibrarySection,
    })),
);

const PartnerCarouselSection = dynamic(
  () =>
    import('@/components/landing/PartnerCarouselSection').then((m) => ({
      default: m.PartnerCarouselSection,
    })),
);

const PaymentSection = dynamic(
  () => import('@/components/landing/PaymentSection').then((m) => ({ default: m.PaymentSection })),
);

const Footer = dynamic(
  () => import('@/components/layout/Footer').then((m) => ({ default: m.Footer })),
);

export async function LandingCoursesSection() {
  const { courses, siteSettings } = await getLandingCoursesData();

  return (
    <CoursesSection
      courses={courses}
      loading={false}
      badge={siteSettings['courses.badge']}
      title={siteSettings['courses.title']}
      titleHighlight={siteSettings['courses.titleHighlight']}
      subtitle={siteSettings['courses.subtitle']}
      buttonText={siteSettings['courses.button']}
    />
  );
}

export async function LandingTrustSection() {
  const { testimonials, trustFeatures, siteSettings } = await getLandingTrustData();

  return (
    <TrustSection
      testimonials={testimonials}
      trustFeatures={trustFeatures}
      sectionTitle={siteSettings['trust.title']}
      sectionSubtitle={siteSettings['trust.subtitle']}
    />
  );
}

export async function LandingTeachersSection() {
  const { teachers, siteSettings } = await getLandingTeachersData();

  return (
    <TeachersSection
      teachers={teachers}
      badge={siteSettings['teachers.badge']}
      title={siteSettings['teachers.title']}
    />
  );
}

export async function LandingLibrarySection() {
  const { ebooks, siteSettings } = await getLandingLibraryData();

  return (
    <DigitalLibrarySection
      dynamicEbooks={ebooks}
      badge={siteSettings['library.badge']}
      title={siteSettings['library.title']}
      titleHighlight={siteSettings['library.titleHighlight']}
      buttonText={siteSettings['library.button']}
    />
  );
}

export async function LandingPartnersSection() {
  const { partners, siteSettings } = await getLandingPartnersData();

  return (
    <PartnerCarouselSection
      partners={partners}
      loadResolved
      badge={siteSettings['partners.badge']}
      title={siteSettings['partners.title']}
      subtitle={siteSettings['partners.subtitle']}
    />
  );
}

export async function LandingPaymentSection() {
  const { siteSettings } = await getLandingFooterData();

  return (
    <PaymentSection
      badge={siteSettings['payment.badge']}
      title={siteSettings['payment.title']}
      subtitle={siteSettings['payment.subtitle']}
      footerText={siteSettings['payment.footer']}
    />
  );
}

export async function LandingFooterSection() {
  const { siteSettings } = await getLandingFooterData();

  return <Footer siteSettings={siteSettings} />;
}
