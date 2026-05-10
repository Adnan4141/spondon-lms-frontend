import type { MetadataRoute } from "next";
import { getPublicBooksCatalog } from "@/lib/api/books";
import { getCourses } from "@/lib/api/courses";
import { getPublicTeachers } from "@/lib/api/teachers";
import { absoluteSiteUrl, SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteSiteUrl("/courses"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteSiteUrl("/books"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteSiteUrl("/teachers"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteSiteUrl("/branches"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteSiteUrl("/about-us"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteSiteUrl("/faq"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteSiteUrl("/privacy-policy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [courseRoutes, teacherRoutes, bookRoutes] = await Promise.all([
    getCourseSitemapRoutes(),
    getTeacherSitemapRoutes(),
    getBookSitemapRoutes(),
  ]);

  return [...staticRoutes, ...courseRoutes, ...teacherRoutes, ...bookRoutes];
}

async function getCourseSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await getCourses({ websiteVisible: true, status: "ACTIVE", all: true });
    if (!res.success || !res.data) return [];
    return res.data.map((course) => ({
      url: absoluteSiteUrl(`/course/${encodeURIComponent(course.slug || course.id)}`),
      lastModified: course.updatedAt ? new Date(course.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: course.featured ? 0.85 : 0.75,
    }));
  } catch {
    return [];
  }
}

async function getTeacherSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await getPublicTeachers();
    if (!res.success || !res.data) return [];
    return res.data.map((teacher) => ({
      url: absoluteSiteUrl(`/teachers/${encodeURIComponent(teacher.id)}`),
      lastModified: teacher.updatedAt ? new Date(teacher.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));
  } catch {
    return [];
  }
}

async function getBookSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await getPublicBooksCatalog({ limit: 300 });
    if (!res.success || !res.data) return [];
    return res.data.map((book) => ({
      url: absoluteSiteUrl(`/books/${encodeURIComponent(book.id)}`),
      lastModified: book.createdAt ? new Date(book.createdAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: book.featured ? 0.75 : 0.6,
    }));
  } catch {
    return [];
  }
}
