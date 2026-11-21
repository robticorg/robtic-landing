import type { MetadataRoute } from 'next';
import { ORIGIN } from '@/lib/site';

// Named as well as covered by '*': a crawler obeys only the group naming it, so they all share these rules.
// Google-Extended is Gemini, not Google Search. https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
const AI_CRAWLERS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
    'PerplexityBot', 'Perplexity-User',
    'Google-Extended',
];

// One file for the whole of robtic.org: the panel and sign-in pages are on this host too.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: ['*', ...AI_CRAWLERS],
            // Sign-in pages and the dashboards (/discord/public too) aren't for search: "Robtic", "Robtic Hosting" and
            // "Robtic Discord" lead to the landing pages.
            allow: [
                '/', '/auth/llms.txt', '/panel/llms.txt',
                '/hosting$', '/hosting/plans', '/hosting/sitemap.xml', '/hosting/llms.txt',
                '/discord$', '/discord/llms.txt', '/discord/sitemap.xml',
            ],
            // Dashboards are private app routes (hosting moved from /panel to /hosting; Discord bot dashboards live
            // under /discord). /panel is kept here for the duration of the move so old links aren't crawled either.
            disallow: ['/panel', '/hosting', '/discord', '/settings', '/auth/', '/api/', '/plans/choose', '/robtic/github/', '/robtic/discord/', '/sanctum/'],
        },
        sitemap: [`${ORIGIN}/sitemap.xml`, `${ORIGIN}/hosting/sitemap.xml`, `${ORIGIN}/discord/sitemap.xml`],
    };
}
