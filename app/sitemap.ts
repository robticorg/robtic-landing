import type { MetadataRoute } from 'next';
import { ORIGIN } from '@/lib/site';
import { getSiteData, legalPages } from '@/lib/site-data';

// Robtic's own pages, for search engines: the home page, the FAQ and the account's own terms and privacy. Each
// service has its own sitemap with its landing page and its own legal pages (/hosting/sitemap.xml from here,
// /discord/sitemap.xml from robtic-discord), so "Robtic Hosting" and "Robtic Discord" each lead to their own page.
// Sign-in pages aren't listed: a search for Robtic should never land on a login screen.
const ACCOUNT_LEGAL = ['terms-robtic', 'privacy-account'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const site = await getSiteData();
    return [
        { url: `${ORIGIN}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${ORIGIN}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        ...legalPages(site).filter((p) => ACCOUNT_LEGAL.includes(p.key)).map((p) => ({
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
