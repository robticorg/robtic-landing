import type { Metadata } from 'next';
import GiftView from './GiftView';

// robtic.org/gift/<code>: a hosting gift made in Admin → Gifts. The box opens, the ticket rises, and a signed-in
// account claims it. The gift is read in the browser from the panel (it limits each visitor, not this server).
//
// Shared on Discord, WhatsApp or X, the link shows only the picture: no amount, no code, nothing to spoil it.
const IMAGE = { url: '/rl/robtic/gift-og.png', width: 1200, height: 630, alt: 'A gift for you from Robtic Hosting' };

export const metadata: Metadata = {
    title: 'A gift for you · Robtic',
    description: null,
    robots: { index: false, follow: false },
    openGraph: { type: 'website', siteName: undefined, title: undefined, description: undefined, images: [IMAGE] },
    twitter: { card: 'summary_large_image', title: undefined, description: undefined, images: [IMAGE.url] },
};

export default async function GiftPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    return <GiftView code={code} />;
}
