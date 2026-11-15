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
            // The services' public pages: their landing pages (/hosting, /discord: those addresses only), Hosting's
            // plans, Discord's server picker (/discord/public$), and each one's llms.txt and sitemap. Everything else
            // under them is a signed-in app and stays disallowed.
            allow: [
                '/', '/auth/login', '/auth/register', '/auth/llms.txt', '/panel/llms.txt',
                '/hosting$', '/hosting/plans', '/hosting/sitemap.xml',
                '/discord$', '/discord/public$', '/discord/llms.txt', '/discord/sitemap.xml',
            ],
            // Dashboards are private app routes (hosting moved from /panel to /hosting; Discord bot dashboards live
            // under /discord). /panel is kept here for the duration of the move so old links aren't crawled either.
            disallow: ['/panel', '/hosting', '/discord', '/settings', '/auth/', '/api/', '/plans/choose', '/robtic/github/', '/robtic/discord/', '/sanctum/'],
        },
        sitemap: [`${ORIGIN}/sitemap.xml`, `${ORIGIN}/hosting/sitemap.xml`, `${ORIGIN}/discord/sitemap.xml`],
    };
}
