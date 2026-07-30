import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import { NumberScrollBlocker } from "@/components/number-scroll-blocker";
import { SITE_URL, absoluteSiteUrl } from "@/lib/seo";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const LOGO_PATH = "/images/logo/mathlab-icon.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Mathlab Academic & Admission Program",
    template: "%s | Mathlab",
  },

  description:
    "Mathlab Academic & Admission Program provides quality education support for 100,000+ students across Bangladesh at the secondary and higher secondary levels.",

  keywords: [
    "Mathlab",
    "Mathlab Academic",
    "SSC preparation Bangladesh",
    "HSC preparation Bangladesh",
    "online education Bangladesh",
    "admission program Bangladesh",
    "secondary education Bangladesh",
    "higher secondary education",
  ],

  authors: [{ name: "Mathlab", url: SITE_URL }],
  creator: "Mathlab",
  publisher: "Mathlab",

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: SITE_URL,
    siteName: "Mathlab Academic & Admission Program",
    title: "Mathlab Academic & Admission Program",
    description:
      "Quality education support for 100,000+ students across Bangladesh. SSC & HSC preparation, admission programs, and live classes by 150+ expert instructors.",
    images: [
      {
        url: LOGO_PATH,
        width: 512,
        height: 512,
        alt: "Mathlab Academic & Admission Program",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mathlab Academic & Admission Program",
    description:
      "Quality education support for 100,000+ students across Bangladesh. SSC & HSC preparation by 150+ expert instructors.",
    images: [LOGO_PATH],
  },

  icons: {
    icon: LOGO_PATH,
    apple: LOGO_PATH,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Mathlab Academic & Admission Program",
  alternateName: "Mathlab",
  url: SITE_URL,
  logo: absoluteSiteUrl(LOGO_PATH),
  foundingDate: "2019",
  description:
    "Provides quality education support for 100,000+ students across Bangladesh at secondary and higher secondary levels.",
  areaServed: "Bangladesh",
  numberOfEmployees: { "@type": "QuantitativeValue", value: 150 },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body
        className={`${manrope.variable} ${spaceMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <NumberScrollBlocker />
        {children}
      </body>
    </html>
  );
}
