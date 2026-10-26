import type { MetadataRoute } from 'next';
import { ORIGIN } from '@/lib/site';

// The public site is open to every crawler. The panel, sign-in, admin and API live on their own paths/host and
// are not this site's to index; we list them anyway so a shared robtic.org front door stays tidy.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/panel', '/admin', '/auth/', '/api/', '/plans/choose', '/robtic/github/', '/robtic/discord/', '/sanctum/'],
        },
        sitemap: `${ORIGIN}/sitemap.xml`,
    };
}
