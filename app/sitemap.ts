import type { MetadataRoute } from 'next';
import { ORIGIN } from '@/lib/site';
import { getSiteData, legalPages } from '@/lib/site-data';

// The public pages, for search engines. The legal pages are the ones set in the admin console, at their addresses.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const site = await getSiteData();
    return [
        { url: `${ORIGIN}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${ORIGIN}/plans`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        ...legalPages(site).map((p) => ({
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
