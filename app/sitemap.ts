import type { MetadataRoute } from 'next';
import { ORIGIN } from '@/lib/site';

// The public pages, for search engines.
export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    return [
        { url: `${ORIGIN}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${ORIGIN}/plans`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${ORIGIN}/terms-hosting`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${ORIGIN}/terms-teams`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${ORIGIN}/privacy-account`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${ORIGIN}/privacy-hosting`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ];
}
