import type { MetadataRoute } from "next";
import { absoluteSiteUrl, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/student/",
          "/teacher/",
          "/login",
          "/register",
          "/forgot-password",
          "/test/",
          "/payment/",
          "/api/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/student/",
          "/teacher/",
          "/login",
          "/register",
          "/forgot-password",
          "/test/",
          "/payment/",
        ],
      },
    ],
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
