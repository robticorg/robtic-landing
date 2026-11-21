import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';

// One page's search and share data, whole. Next replaces a parent's openGraph / twitter objects instead of merging
// them, so every page gives all of it here: its own title, description, address and share picture. That's what makes
// "Robtic", "Robtic Hosting" and "Robtic Discord" each find their own landing page, and each link share its own card.

export const SHARE = {
    home: { url: '/rl/robtic/og/og-home.png', alt: 'Robtic: tools for the people who build on Discord' },
    hosting: { url: '/rl/robtic/og/og-hosting.png', alt: 'Robtic Hosting: hosting for Discord bots and the apps around them' },
    discord: { url: '/rl/robtic/og/og-discord.png', alt: 'Robtic Discord: Discord bots, set up from one dashboard' },
} as const;

export function pageMeta({
    title,
    description,
    path,
    share = SHARE.home,
    shareTitle,
    keywords,
}: {
    title: string;
    description: string;
    /** The page's own address ('/hosting'); also its canonical. */
    path: string;
    share?: { url: string; alt: string };
    /** A shorter title for share cards (defaults to the page title). */
    shareTitle?: string;
    keywords?: string[];
}): Metadata {
    const url = `${ORIGIN}${path === '/' ? '' : path}`;
    // A picture set in the admin console may live on another host: then its address is used as it is.
    const image = { url: /^https?:\/\//.test(share.url) ? share.url : `${ORIGIN}${share.url}`, width: 1200, height: 630, alt: share.alt };
    return {
        title,
        description,
        ...(keywords ? { keywords } : {}),
        alternates: { canonical: path },
        openGraph: { type: 'website', siteName: 'Robtic', locale: 'en_US', title: shareTitle ?? title, description, url, images: [image] },
        twitter: { card: 'summary_large_image', title: shareTitle ?? title, description, images: [image.url] },
    };
}
