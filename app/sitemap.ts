import type { MetadataRoute } from "next";
import { API_ORIGIN } from "@/lib/api";
import { resolveAttachmentUrl } from "@/lib/attachment-url";
import { getBookCategories, getPublicBooksCatalog } from "@/lib/api/books";
import { getCourses } from "@/lib/api/courses";
import { getPublicTeachers } from "@/lib/api/teachers";
import {
  absoluteSiteUrl,
  DEFAULT_OG_IMAGE,
  SITE_URL,
  toAbsoluteImageUrl,
} from "@/lib/seo";

/** Refresh public sitemap at most every hour. */
export const revalidate = 3600;

const DEFAULT_SITEMAP_IMAGE = absoluteSiteUrl(DEFAULT_OG_IMAGE);

function sitemapImage(url?: string | null): string[] {
  const absolute = toAbsoluteImageUrl(url);
  return absolute ? [absolute] : [DEFAULT_SITEMAP_IMAGE];
}

function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return toAbsoluteImageUrl(resolveAttachmentUrl(path, API_ORIGIN));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/courses"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/books"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/teachers"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/branches"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/about-us"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/faq"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      images: [DEFAULT_SITEMAP_IMAGE],
    },
    {
      url: absoluteSiteUrl("/privacy-policy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [courseRoutes, teacherRoutes, bookRoutes, categoryRoutes] = await Promise.all([
    getCourseSitemapRoutes(),
    getTeacherSitemapRoutes(),
    getBookSitemapRoutes(),
    getBookCategorySitemapRoutes(),
  ]);

  const all = [
    ...staticRoutes,
    ...courseRoutes,
    ...teacherRoutes,
    ...bookRoutes,
    ...categoryRoutes,
  ];

  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
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
      images: sitemapImage(mediaUrl(course.thumbnail)),
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
      images: sitemapImage(mediaUrl(teacher.profileImage)),
    }));
  } catch {
    return [];
  }
}

async function getBookSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await getPublicBooksCatalog({ limit: 500 });
    if (!res.success || !res.data) return [];
    return res.data.map((book) => ({
      url: absoluteSiteUrl(`/books/${encodeURIComponent(book.id)}`),
      lastModified: book.createdAt ? new Date(book.createdAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: book.featured ? 0.75 : 0.6,
      images: sitemapImage(mediaUrl(book.thumbnailUrl)),
    }));
  } catch {
    return [];
  }
}

async function getBookCategorySitemapRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await getBookCategories();
    if (!res.success || !res.data) return [];
    return res.data.map((category) => ({
      url: absoluteSiteUrl(`/books/categories/${encodeURIComponent(category.slug)}`),
      lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: [DEFAULT_SITEMAP_IMAGE],
    }));
  } catch {
    return [];
  }
}
