import { ORIGIN } from '@/lib/site';
import { getSiteData, legalPages } from '@/lib/site-data';

// /hosting/sitemap.xml: Robtic Hosting's public pages (its landing page, plans and its own terms), so it can be
// submitted to Search Console on its own. The home page's sitemap (/sitemap.xml) and Discord's
// (/discord/sitemap.xml) cover the rest; each address is in one sitemap only.

export const revalidate = 3600;

const HOSTING_LEGAL = ['terms-hosting', 'privacy-hosting', 'terms-teams'];

export async function GET() {
    const site = await getSiteData();
    const today = new Date().toISOString().slice(0, 10);
    const legal = legalPages(site).filter((p) => HOSTING_LEGAL.includes(p.key));
    const urls: Array<[string, string, string]> = [
        ['/hosting', 'weekly', '0.9'],
        ['/hosting/plans', 'monthly', '0.8'],
        ...legal.map((p): [string, string, string] => [`/${p.path}`, 'yearly', '0.3']),
    ];
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(([path, freq, pri]) => `  <url><loc>${ORIGIN}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`),
        '</urlset>',
        '',
    ].join('\n');
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
