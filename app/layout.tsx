import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import { NumberScrollBlocker } from "@/components/number-scroll-blocker";
import { jsonLdScript } from "@/lib/seo";
import {
  buildOrganizationJsonLd,
  buildRootMetadata,
  buildWebsiteJsonLd,
  loadSeoBrand,
} from "@/lib/seo-brand";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await loadSeoBrand();

  return (
    <html lang="bn">
      <body
        className={`${manrope.variable} ${spaceMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(buildOrganizationJsonLd(brand)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(buildWebsiteJsonLd(brand)) }}
        />
        <NumberScrollBlocker />
        {children}
      </body>
    </html>
  );
}
