import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import { NumberScrollBlocker } from "@/components/number-scroll-blocker";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://spondonedu.com"),

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

  authors: [{ name: "Mathlab", url: "https://spondonedu.com" }],
  creator: "Mathlab",
  publisher: "Mathlab",

  alternates: {
    canonical: "https://spondonedu.com",
  },

  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: "https://spondonedu.com",
    siteName: "Mathlab Academic & Admission Program",
    title: "Mathlab Academic & Admission Program",
    description:
      "Quality education support for 100,000+ students across Bangladesh. SSC & HSC preparation, admission programs, and live classes by 150+ expert instructors.",
    images: [
      {
        url: "/images/logo/mathlab-icon.png",
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
    images: ["/images/logo/mathlab-icon.png"],
  },

  icons: {
    icon: "/images/logo/mathlab-icon.png",
    apple: "/images/logo/mathlab-icon.png",
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
  url: "https://spondonedu.com",
  logo: "https://spondonedu.com/images/logo/mathlab-icon.png",
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
