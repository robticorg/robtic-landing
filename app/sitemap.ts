import type { MetadataRoute } from 'next';
import { ORIGIN } from '@/lib/site';
import { getSiteData, legalPages } from '@/lib/site-data';

// Robtic's own pages, for search engines: the home page, the FAQ, the account pages and the account's legal pages.
// Each service has its own sitemap with its landing page and its own terms (/hosting/sitemap.xml,
// /discord/sitemap.xml), so every address is listed in exactly one.
const SERVICE_PAGE = /^(terms|privacy)\/(hosting|teams|discord|[a-z]+-bot)$/;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const site = await getSiteData();
    return [
        { url: `${ORIGIN}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${ORIGIN}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${ORIGIN}/auth/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${ORIGIN}/auth/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
        ...legalPages(site).filter((p) => !SERVICE_PAGE.test(p.path)).map((p) => ({
            url: `${ORIGIN}/${p.path}`,
            lastModified: validDate(p.updated) ?? now,
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        })),
    ];
}

function validDate(text?: string): Date | null {
    const d = text ? new Date(text) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
}
