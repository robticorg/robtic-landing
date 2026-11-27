import type { Metadata } from 'next';
import { ORIGIN } from '@/lib/site';
import GiftView from './GiftView';

// robtic.org/gift/<code>: a hosting gift made in Admin → Gifts. The box opens, the ticket rises, and a signed-in
// account claims it. The page itself reads the gift in the browser (the panel limits each visitor, not this server).
//
// Shared on Discord, WhatsApp or X, the link shows only a picture: no amount, no code, nothing to spoil it. Once
// every use is claimed, the picture says so.
const PANEL_API_ORIGIN = (process.env.PANEL_API_ORIGIN || ORIGIN).replace(/\/$/, '');
const CODE = /^RB-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

const OPEN = { url: '/rl/robtic/gift-og.png', width: 1200, height: 630, alt: 'A gift for you from Robtic Hosting' };
const CLAIMED = { url: '/rl/robtic/gift-og-claimed.png', width: 1200, height: 630, alt: 'This Robtic Hosting gift was claimed' };

/** All claimed? Asked once a minute at most per gift; anything unexpected keeps the normal picture. */
async function claimed(code: string): Promise<boolean> {
    if (!CODE.test(code)) return false;
    try {
        const res = await fetch(`${PANEL_API_ORIGIN}/api/robtic/gifts/${code}`, {
            headers: { Accept: 'application/json', 'User-Agent': 'robtic-landing/1.0' },
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(3000),
        });
        return res.ok && (await res.json())?.state === 'used_up';
    } catch {
        return false;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
    const code = decodeURIComponent((await params).code).toUpperCase();
    const done = await claimed(code);
    const image = done ? CLAIMED : OPEN;
    const title = done ? 'This gift was claimed · Robtic' : 'A gift for you · Robtic';

    return {
        title,
        description: null,
        robots: { index: false, follow: false },
        openGraph: { type: 'website', siteName: undefined, title, description: undefined, images: [image] },
        twitter: { card: 'summary_large_image', title, description: undefined, images: [image.url] },
    };
}

export default async function GiftPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    return <GiftView code={code} />;
}
